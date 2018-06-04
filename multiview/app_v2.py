from flask import Flask, render_template, jsonify, request
#from flask_restful import Api, Resource, reqparse

from watchdog.observers import Observer

from db.saxs_v2.db_config import MONGODB_CONFIG
from db.multiviewmongo import MultiViewMongo
from watcher_utils import xmlParser as Parser
from watcher import Handler
from threading import Thread
from bson.objectid import ObjectId

from time import sleep
import re

# Flask application
app = Flask(__name__)
SERVER_HOST = 'localhost'
SERVER_PORT = 8001

# DB and file system handler
db = MultiViewMongo(
    db_name='test',
    collection_name='test',
    hostname='localhost',
    port=27017
)
parser = Parser(config=MONGODB_CONFIG['XML'])
handler = Handler(db, parser)
handler.start()
print('DB handler started!')

# event list
eventlist = [] # (action, objectId)
eventlist_flag = 0 # 0: idle, 1: used by handler, 2: used by flask



def replace_objid_to_str(doc):
    if not isinstance(doc, dict):
        return doc

    for (key, value) in doc.items():
        if isinstance(value, ObjectId):
            doc[key] = str(value)
        elif isinstance(value, dict):
            doc[key] = replace_objid_to_str(value)

    return doc

def flatten_dict(d):
    def expand(key, value):
        if isinstance(value, dict):
            return [(key + '/' + k, v) for k, v in flatten_dict(value).items()]
        else:
            return [(key, value)]

    items = [item for k, v in d.items() for item in expand(k, v)]
    return dict(items)

def _get_current_data_stat():
    """
    Return the number of items under each sample
    """
    pipeline = [{"$group": {"_id": "$sample", "count": {"$sum": 1}}}]
    res = list(db.collection.aggregate(pipeline))
    resDict = {}
    for r in res:
        sampleName = r['_id']
        count = r['count']
        resDict[sampleName] = count
    return resDict


@app.route('/api/data/stat', methods=['GET'])
def get_current_data_stat():
    return jsonify(_get_current_data_stat())

@app.route('/api/data/sample', methods=['GET'])
def get_sample():
    sampleList = request.args.getlist('name[]')

    sampleData = {}
    for sample in sampleList:
        query = {"sample": sample}
        res = db.load(query=query, fields={}, getarrays=False)

        if not isinstance(res, list):
            res = [res]
        res = [replace_objid_to_str(doc) for doc in res]
        res = [flatten_dict(d) for d in res]
        sampleData[sample] = res

    return jsonify({
        'sampleList': sampleList,
        'sampleData': sampleData,
        'stat': _get_current_data_stat()
    })

@app.route('/api/data/sample/monitor', methods=['GET'])
def update_sample():
    global eventlist, eventlist_flag
    sampleList = []
    sampleData = {}
    stat = {}

    if eventlist_flag == 0 and len(eventlist) > 0:
        eventlist_flag = 2

        #print(eventlist)
        # event: tuple
        # - [0]: action in [ADD, UPDATE, DELETE]
        # - [1]: type in [.xml, .tiff, .jpg]
        # - [2]: item name (assume it is unique for each data point)
        resList = []
        processed = []
        for event in list(reversed(eventlist)):
            action, doc_type, item_name = event
            if item_name in processed:
                continue

            #print(event)
            query = {'item': item_name}
            res = db.load(query=query, fields={}, getarrays=False)

            if not isinstance(res, list):
                res = [res]
            res = [replace_objid_to_str(doc) for doc in res]
            res = [flatten_dict(d) for d in res]
            resList.append(res)
            processed.append(item_name)

        for res in resList:
            if isinstance(res, list):
                res = res[0]

            sampleName = res['sample']
            if sampleName in sampleList:
                sampleData[sampleName].append(res)
            else:
                sampleList.append(sampleName)
                sampleData[sampleName] = [res]


        eventlist = []
        eventlist_flag = 0

        stat = _get_current_data_stat()
        #print(resList)
        #print(sampleData)
        #print(sampleList)
        #print(stat)

    return jsonify({
        'sampleList': sampleList,
        'sampleData': sampleData,
        'stat': stat
    })

@app.route('/api/data/tiff/<id>', methods=['GET'])
def get_tiff(id):
    query = {'_id': ObjectId(id), 'tiff':{'$exists':True}}
    fields = {'tiff': 1, '_id': 0}
    res = db.load(query, fields, getarrays=True)

    if res is None:
        return jsonify({})

    data = res['tiff']['data']
    res['tiff']['data'] = data.tolist()
    return jsonify(res['tiff'])











@app.route('/api/data/kinds/sample', methods=['GET'])
def get_kind_sample():
    res = db.distinct('sample')
    sortedRes = sorted(res, key=lambda x: re.sub('[^A-Za-z]+', '', x).upper())

    key = 0
    doc_kinds = dict()
    for kind in sortedRes:
        doc_kinds[str(key)] = kind
        key += 1

    return jsonify(doc_kinds)








@app.route('/')
def start():
    return render_template('index.html')


def run_watcher(dir_to_watch='.'):
    global eventlist_flag, eventlist
    observer = Observer()

    observer.schedule(handler, dir_to_watch, recursive=True)
    observer.start()
    print('FS observer started')

    try:
        while True:
            # updat global list
            if handler.get_jobdonelist_size() > 0 and eventlist_flag == 0:
                eventlist_flag = 1
                handler.set_jobq_hold_flag(True)

                eventlist = eventlist + handler.get_jobdonelist()

                eventlist_flag = 0
                handler.set_jobq_hold_flag(False)

            sleep(1)

    except KeyboardInterrupt:
        observer.stop()

    observer.join()


if __name__ == '__main__':

    watcher_thread = Thread(target=run_watcher, args=('/Users/scott/Desktop/test',))
    watcher_thread.start()

    try:
        app.run(host=SERVER_HOST, port=SERVER_PORT)
    except KeyboardInterrupt:
        pass
    finally:
        watcher_thread.join()
