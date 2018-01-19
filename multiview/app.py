from flask import Flask, render_template
from flask_restful import Api, Resource, reqparse

from db.saxs_v2.db_config import MONGODB_CONFIG
from multiviewdb import MultiViewDB

import re

from bson.objectid import ObjectId


app = Flask(__name__)
app.config.update(
    DEBUG=True,
    TEMPLATES_AUTO_RELOAD=True
)
api = Api(app)

mvdb = MultiViewDB(config=MONGODB_CONFIG)

SERVER_HOST = 'localhost'
SERVER_PORT = 8001


def replace_objid_to_str(doc):
    if not isinstance(doc, dict):
        return doc

    for (key, value) in doc.items():
        if isinstance(value, ObjectId):
            doc[key] = str(value)
        elif isinstance(value, dict):
            doc[key] = replace_objid_to_str(value)

    return doc



class MVDataSampleKinds(Resource):
    def get(self, key):
        results = mvdb.distinct(key)
        sortedResults = sorted(results, key=lambda x: re.sub('[^A-Za-z]+', '', x).upper())

        key = 0
        doc_kinds = dict()
        for kind in sortedResults:
            doc_kinds[str(key)] = kind
            key += 1

        return doc_kinds


class MVDataAttr(Resource):
    def get(self):
        query = {'dataStatKey': 1}
        fields = {'_id': 0, 'dataStatKey': 0, 'insertion_date': 0, '_npObjectIDs': 0}
        result = mvdb.query(query=query, fields=fields, getarrays=False)

        newResult = dict()
        for key, value in result.items():
            newKey = key.replace(':', '.')
            valueType = 'num'
            if isinstance(value[0], str):
                valueType = 'str'
            newResult[newKey] = {
                'minmax': value,
                'type': valueType
            }

        return newResult


class MVSampleAPI(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('name[]', action='append')
        args = parser.parse_args()

        sampleList = args.get('name[]')

        #query = {"sample": {'$in': sampleList }}
        fields = {'_npObjectIDs': 0, 'insertion_date': 0}

        resultList = []
        for sample in sampleList:
            query = {"sample": sample, 'item': {'$exists': 'true'}}
            results = mvdb.query(query=query, fields=fields, getarrays=False)
            allResults = [replace_objid_to_str(doc) for doc in results]
            resultList.append(allResults)
            #print('{}.{}'.format(sample, len(resultList)))

        return {
            'sampleList': sampleList,
            'sampleData': resultList
        }


class MVTiffAPI(Resource):
    def get(self, id):
        query = {'_id': ObjectId(id)}
        fields = {'tiff': 1, '_id': 0}

        result = mvdb.query(query=query, fields=fields, getarrays=True)
        data = result['tiff']['data']

        result['tiff']['data'] = data.tolist()
        return result['tiff']


api.add_resource(MVDataSampleKinds, '/api/data/kinds/<string:key>', endpoint='kinds')
api.add_resource(MVDataAttr, '/api/data/attr', endpoint='attr')
api.add_resource(MVSampleAPI, '/api/data/sample', endpoint='sample')
api.add_resource(MVTiffAPI, '/api/data/tiff/<string:id>', endpoint='tiff')

@app.route('/')
def start():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host=SERVER_HOST, port=SERVER_PORT)