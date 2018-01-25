from db.multiviewmongo import MultiViewMongo

# change db setting
from db.saxs_v2.db_config import MONGODB_CONFIG

import os
import ntpath
import xml.etree.ElementTree as ET
from pathlib import Path
import numpy as np
from PIL import Image
import scipy.ndimage

import re
import pprint
import matplotlib.pyplot as plt

from datetime import datetime


def flattenDict(nestedDict):
    fDict = dict()
    for key, value in nestedDict.items():
        if type(value) == dict:
            _dict = {':'.join([key, _key]): _value for _key, _value in flattenDict(value).items()}
            fDict.update(_dict)
        else:
            fDict[key]=value
    return fDict


class MultiViewDB(object):
    def __init__(self, config=MONGODB_CONFIG):
        self.root = config['ROOT']
        self.db_config = config['DB']
        self.xml_config = config['XML']
        self.tiff_config = config['TIFF']
        self.time_config = config['TIME']
        self.thumbnail_config = config['THUMBNAIL']

        self.dataStat = dict()
        self.dataStat['dataStatKey'] = 0
        #print(self.dataStat)

        # open db
        self.db = MultiViewMongo(
            self.db_config['NAME'],
            self.db_config['COLLECTION'],
            self.db_config['HOST'],
            self.db_config['PORT']
        )

    def run(self):
        root_dir = self.root + self.xml_config['DIR']

        count = 0
        for fn in os.listdir(root_dir):
            if fn.endswith('.xml'):
                doc = self._xml_to_doc(root_dir + fn)
                self._update_stat(doc)

                if 'thumbnails' in doc and self.thumbnail_config['SAVE']:
                    self._add_thumbnails(doc)

                if 'tiff' in doc and self.tiff_config['SAVE']:
                    self._add_tiff(doc)

                doc['dataStatKey'] = 0
                self.db.save(doc)
                count += 1
                print('Add {}: {}'.format(count, fn))

        for key, value in self.dataStat.items():
            if isinstance(value, list) and isinstance(value[0], str):
                self.dataStat[key] = sorted(value, key=lambda x: re.sub('[^A-Za-z]+', '', x).upper())

        self.dataStat['dataStatKey'] = 1
        self.db.save(self.dataStat)

        print('\n%d documents are inserted to the DB\n' % count)
        #pp.pprint(flattenDict(doc))


    def query(self, query, fields={}, getarrays=False):
        return self.db.load(query, fields, getarrays)

    def distinct(self, key):
        return self.db.distinct(key=key)

    def _get_value(self, x):
        if isinstance(x, list):
            return x[len(x) - 1]
        return x

    def _get_value_by_key(self, dict, key, default_value):
        if key in dict:
            value = dict[key]

            if not isinstance(default_value, str):
                value = float(value)

            if isinstance(value, str):
                value = self._get_value(value.split('/'))

            return value

        return default_value

    def _have_file(self, path, extensions):
        for ext in extensions:
            if Path(path + ext).exists() and Path(path + ext).is_file():
                return path + ext
        return ''

    def _add_tiff(self, doc):
        root_dir = self.root + self.tiff_config['DIR']
        path = root_dir + doc['tiff']
        path = self._have_file(path, self.tiff_config['EXT'])
        if len(path):
            im = Image.open(path)
            imarr = np.array(im)

            if self.tiff_config['MODIFY']:
                row = self.tiff_config['CROP']['ROW']
                col = self.tiff_config['CROP']['COL']
                imarr = imarr[row::, col::]
                imarr = scipy.ndimage.zoom(imarr, self.tiff_config['RESIZE'], order=1)

            dim = imarr.shape

            tiff_doc = dict()
            tiff_doc['data'] = imarr
            tiff_doc['width'] = int(dim[1])
            tiff_doc['height'] = int(dim[0])
            tiff_doc['channel'] = int(1)
            tiff_doc['min'] = float(imarr.min())
            tiff_doc['max'] = float(imarr.max())

            doc['tiff'] = tiff_doc

    def _add_thumbnails(self, doc):
        root_dir = self.root + self.thumbnail_config['DIR']
        path = root_dir + doc['thumbnails']['data']
        path = self._have_file(path, self.thumbnail_config['EXT'])
        if len(path):
            #data = open(path, 'rb').read()
            im = Image.open(path)
            imarr = np.array(im)
            dim = imarr.shape
            thumb_doc = dict()
            thumb_doc['data'] = np.array(im)
            thumb_doc['width'] = int(dim[1])
            thumb_doc['height'] = int(dim[0])
            thumb_doc['channel'] = int(dim[2])
            doc['thumbnails'] = thumb_doc

    def _add_protocol(self, pr_name, pr_time, value, doc):
        if pr_name in doc:
            if pr_time > doc[pr_name]['time']:
                value['time'] = pr_time
                doc[pr_name] = {'data': value, 'time': pr_time}
        else:
            doc[pr_name] = {'data': value, 'time': pr_time}

        return doc

    def _xml_to_doc(self, filename):
        tree = ET.parse(filename)

        doc = dict()

        root = tree.getroot()
        #root_tag = root.tag
        root_att = root.attrib

        item_name = self._get_value_by_key(root_att, self.xml_config['ROOTID'], 'unknown')
        if item_name == 'unknown':
            return None

        item_name = ntpath.basename(item_name)
        item_name = os.path.splitext(item_name)[0]

        sample_name = item_name.split(self.xml_config['SAMPLE_SPLIT'])
        doc['item'] = item_name
        doc['sample'] = sample_name[0]

        # Loop over all protocols
        for protocol in root:
            #pr_tag = protocol.tag
            pr_att = protocol.attrib

            pr_name = self._get_value_by_key(pr_att, self.xml_config['PID'], 'unknown')

            # ignore unknown protocol
            if pr_name == 'unknown':
                continue

            pr_time = self._get_value_by_key(pr_att, self.xml_config['TIMESTAMP'], 0)

            # special case for thumbnails protocol
            if pr_name == 'thumbnails':
                self._add_protocol(pr_name, pr_time, item_name, doc)
                continue

            pr_dict = dict()
            for experiment in protocol:
                ex_att = experiment.attrib
                ex_name = self._get_value_by_key(ex_att, self.xml_config['RID'], 'unknown')
                if ex_name == 'unknown' or ex_name in self.xml_config['R_EXCLUDE']:
                    continue

                default_value = 0
                if ex_name in self.xml_config['R_STRING']:
                    default_value = '0'

                ex_value = self._get_value_by_key(ex_att, self.xml_config['RVAL'], default_value)
                pr_dict[ex_name] = ex_value

            self._add_protocol(pr_name, pr_time, pr_dict, doc)

        doc['tiff'] = item_name

        return doc

    def _update_stat(self, doc):
        fdict = flattenDict(doc)
        for key, value in fdict.items():
            if ("thumbnails" in key) or ("tiff" in key) or ("item" in key):
                continue

            type = 'num'
            if isinstance(value, str):
                type = 'str'

            if key in self.dataStat:
                if type is 'str':
                    if not value in self.dataStat[key]:
                        self.dataStat[key].append(value)
                else:
                    prev = self.dataStat[key]
                    prev[0] = min(prev[0], value)
                    prev[1] = max(prev[1], value)
                    self.dataStat[key] = prev
            else:
                if type is 'str':
                    self.dataStat[key] = [value]
                else:
                    self.dataStat[key] = [value,value]


if __name__ == "__main__":
    mvdb = MultiViewDB(config=MONGODB_CONFIG)

    # build database
    mvdb.run()

    # query by sample
    #query = {"sample": "VS_BTD-IX-133-1a_irregular"}
    #documents = mvdb.query(query)
    #print('{} documents found'.format(len(documents)))

    #query2 = {"_id": documents[0]['_id']}
    #fields = {"_id": 1, "tiff": 1, "_npObjectIDs": 1}
    #doc = mvdb.query(query=query2, fields=fields, getarrays=True)
    #pp = pprint.PrettyPrinter(indent=4)
    #pp.pprint(doc)

    #imarr = doc['tiff']['data']
    #cmap = plt.cm.get_cmap('jet')
    #imColor = cmap(imarr)
    #imColor = np.uint8(imColor * 255)
    #imColor = Image.fromarray(imColor)
    #imColor.show()












