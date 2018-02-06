from db.multiviewmongo import MultiViewMongo
from db.synthetic.db_config import MONGODB_CONFIG
import os
import xml.etree.ElementTree as ET
from parse import parse
import pprint
from pathlib import Path
import numpy as np
from PIL import Image
import scipy.ndimage
import re

def showDocPretty(doc):
    pp = pprint.PrettyPrinter(indent=2)
    pp.pprint(doc)


def flattenDict(nestedDict):
    fDict = dict()
    for key, value in nestedDict.items():
        if type(value) == dict:
            _dict = {':'.join([key, _key]): _value for _key, _value in flattenDict(value).items()}
            fDict.update(_dict)
        else:
            fDict[key]=value
    return fDict


def haveFile(path, extensions):
    for ext in extensions:
        if Path(path + ext).exists() and Path(path + ext).is_file():
            return path + ext
    return ''


class MultiViewDBSynthetic(object):
    def __init__(self, config=MONGODB_CONFIG):
        self.root = config['ROOT']
        self.db_config = config['DB']
        self.xml_config = config['XML']
        self.thumbnail_config = config['THUMBNAIL']

        self.dataStat = dict()
        self.dataStat['dataStatKey'] = 0

        self.db = MultiViewMongo(
            self.db_config['NAME'],
            self.db_config['COLLECTION'],
            self.db_config['HOST'],
            self.db_config['PORT']
        )


    def query(self, query, fields={}, getarrays=False):
        return self.db.load(query, fields, getarrays)


    def distinct(self, key):
        return self.db.distinct(key=key)


    def run(self):
        root_dir = self.root + self.xml_config['DIR']
        count = 0
        for fn in os.listdir(root_dir):
            if fn.endswith('.xml'):
                doc = self._xml_to_doc(root_dir + fn)
                self._update_stat(doc)

                if self.thumbnail_config['SAVE']:
                    self._add_thumbnails(doc)

                doc['dataStatKey'] = 0
                self.db.save(doc)
                count = count + 1
                print('Add {}: {}'.format(count, fn))

        for key, value in self.dataStat.items():
            if isinstance(value, list) and isinstance(value[0], str):
                self.dataStat[key] = sorted(value, key=lambda x: re.sub('[^A-Za-z]+', '', x).upper())

        self.dataStat['dataStatKey'] = 1
        self.db.save(self.dataStat)
        print('\n%d documents are inserted to the DB\n' % count)
        #showDocPretty(self.dataStat)


    def _get_value(self, x):
        if isinstance(x, list):
            return x[len(x)-1]
        return x


    def _get_value_by_key(self, dict, key, default_value):
        BoolianValues = ['True', 'T', 'true', 'False', 'F', 'false']
        if key in dict:
            value = dict[key]
            if isinstance(value,str) and value in BoolianValues:
                if value in ['True', 'T', 'true']:
                    value = 1
                else:
                    value = 0

            if not isinstance(default_value, str):
                value = float(value)

            if isinstance(value, str):
                value = self._get_value(value.split('/'))

            return value

        return default_value


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
        root_attr = root.attrib

        item_name = self._get_value_by_key(root_attr, self.xml_config['ROOTID'], 'unknown')
        if item_name == 'unknown':
            return None

        # parsing item name
        item_name_parsed = parse("x{}y{}i{}", item_name)
        x = int(item_name_parsed[0])
        y = int(item_name_parsed[1])
        i = int(item_name_parsed[2], 16)
        doc['item'] = item_name
        doc['sample'] = 'synthetic'
        doc['item_x'] = x
        doc['item_y'] = y
        doc['item_i'] = i

        # Loop over all protocols
        for protocol in root:
            pr_attr = protocol.attrib
            pr_name = self._get_value_by_key(pr_attr, self.xml_config['PID'], 'unknown')
            if pr_name == 'unknown':
                continue

            pr_time = self._get_value_by_key(pr_attr, self.xml_config['TIMESTAMP'], 0)
            pr_dict = dict()
            for experiment in protocol:
                ex_attr = experiment.attrib
                ex_name = self._get_value_by_key(ex_attr, self.xml_config['RID'], 'unknown')
                if ex_name == 'unknown' or ex_name in self.xml_config['R_EXCLUDE']:
                    continue

                default_value = 0
                if ex_name in self.xml_config['R_STRING']:
                    default_value = '0'
                ex_value = self._get_value_by_key(ex_attr, self.xml_config['RVAL'], default_value)

                ex_name = ex_name.replace('.','_')
                ex_name = ex_name.replace(' ','')
                ex_name = ex_name.replace(':','-')
                pr_dict[ex_name] = ex_value

            self._add_protocol(pr_name, pr_time, pr_dict, doc)

        self._add_protocol('thumbnails', 0, item_name, doc)

        #showDocPretty(doc)
        return doc


    def _add_thumbnails(self, doc):
        root_dir = self.root + self.thumbnail_config['DIR']
        path = root_dir + doc['thumbnails']['data']
        path = haveFile(path, self.thumbnail_config['EXT'])
        if len(path):
            im = Image.open(path)
            imarr = np.array(im)
            dim = imarr.shape
            thumb_doc = dict()
            thumb_doc['data'] = np.array(im)
            thumb_doc['width'] = int(dim[1])
            thumb_doc['height'] = int(dim[0])
            thumb_doc['channel'] = int(dim[2])
            doc['thumbnails'] = thumb_doc


    def _update_stat(self, doc):
        fdict = flattenDict(doc)
        for key, value in fdict.items():
            if "item" is key:
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
                    self.dataStat[key] = [value, value]


if __name__ == "__main__":
    mvdb = MultiViewDBSynthetic(config=MONGODB_CONFIG)
    mvdb.run()























