import os
import re
import threading
import time
import subprocess

from os.path import splitext, expanduser, normpath

from watchdog.events import FileSystemEventHandler, PatternMatchingEventHandler
from watchdog.observers import Observer

from db.saxs_v2.db_config import MONGODB_CONFIG
from db.multiviewmongo import MultiViewMongo
from watcher_utils import xmlParser

try:
    from Queue import Queue
except ImportError:
    from queue import Queue




class Handler(FileSystemEventHandler):
    def __init__(self, pattern):
        self.pattern = pattern or (".xml", ".tiff", ".jpg")

        self.eventScheduler = None
        self.dbManager = None

        # event queue, populated by Handler and consumed by eventScheduler
        self.q = Queue()

        # job list, managed by eventScheduler
        self.thresh = 1.
        self.joblist = []

        # job queue, populated by eventScheduler and consumed by dbManager
        self.jobq = Queue()

        # database (MongoDB)
        self.xml = xmlParser(config=MONGODB_CONFIG['XML'])
        self.db = MultiViewMongo(
            db_name='test',
            collection_name='tmp',
            hostname='localhost',
            port=27017
        )

    def start(self):
        self.eventScheduler = threading.Thread(target=self._process_q)
        self.eventScheduler.daemon = True
        self.eventScheduler.start()

        self.dbManager = threading.Thread(target=self._process_job)
        self.dbManager.daemon = True
        self.dbManager.start()

    def on_modified(self, event):
        if not event.is_directory and event.src_path.endswith(self.pattern):
            self.q.put((event, time.time()))

    def on_deleted(self, event):
        if not event.is_directory and event.src_path.endswith(self.pattern):
            new_joblist = []
            for job in self.joblist:
                if not job[0] == event.src_path:
                    new_joblist.append(list(job))
            self.jobq.put(([event.src_path, event.event_type, time.time()], time.time()))
            self.joblist = new_joblist

    def on_created(self, event):
        if not event.is_directory and event.src_path.endswith(self.pattern):
            self.q.put((event, time.time()))

    def update_joblist(self, src_path, event_type, ts):
        the_job = None
        for job in self.joblist:
            if job[0] == src_path:
                the_job = job
                break

        if the_job is None:
            self.joblist.append([src_path, event_type, ts])
        else:
            the_job[2] = ts

    def check_joblist(self, ts):
        if len(self.joblist) == 0:
            return None

        the_job = None
        for job, idx in zip(self.joblist, range(len(self.joblist))):
            prev_ts = job[-1]
            if ts - prev_ts > self.thresh:
                the_job = list(job)
                del self.joblist[idx]
                break
        return the_job

    def _add_doc(self, doc):
        """
        Add a document. If a document having same 'item' value,
        it will update the exist one.
        """
        r = self.db.save_doc_one(doc)
        action = 'ADD' if r is None else 'UPDATE'
        print('[doc] {:s}: {:s}'.format(action, doc['item']))

    def _add_img(self, doc, type='tiff'):
        """
        Add a tiff document. If a document having same 'item' value,
        it will update the exist one.
        """
        r = self.db.save_img_one(doc, type)
        action = 'ADD' if r is None else 'UPDATE'
        print('[{:s}] {:s}: {:s}'.format(type, action, doc['item']))

    def _del_doc(self, src_path):
        """
        Delete a document if it exists

        WARN: this will also delete all image data

        :param src_path:
        :return:
        """
        item_name, _ = splitext(src_path)
        item_name = item_name.split('/')[-1]
        query = {'item': item_name}
        out = self.db.load(query, {}, getarrays=False)
        if not out is None:
            # delete the document
            # WARN: this will also delete image data!!!!
            self.db.delete(out['_id'])

    def _process_job(self):
        while True:
            if self.jobq.empty():
                continue

            job, ts = self.jobq.get()

            src_path = job[0]
            event_type = job[1]
            _, ext = os.path.splitext(src_path)

            if event_type == 'created' or event_type == 'modified':
                if ext == '.xml':
                    doc = self.xml.xml_to_doc(src_path)
                    self._add_doc(doc)
                elif ext == '.tiff':
                    doc = self.xml.tiff_to_doc(src_path)
                    self._add_img(doc, 'tiff')
                elif ext == '.jpg':
                    doc = self.xml.jpg_to_doc(src_path)
                    self._add_img(doc, 'jpg')
            elif event_type == 'deleted':
                print("TODO: delete doc")
                #self._del_doc(src_path)
            else:
                print("Unknown event type: ", event_type)

    def _process_q(self):
        """
        process for eventScheduler
        : for events in the queue,
        :   1. update time stamp (when the event is inserted to job list)
        :   2. if the event exist, and time difference > threashold, pass to other thread (add to job queue)
        """
        while True:
            curr_ts = time.time()
            if self.q.empty():
                # update db (only one job at a time)
                job = self.check_joblist(curr_ts)
                if job is not None:
                    self.jobq.put((job, curr_ts))
                continue

            event, ts = self.q.get()

            # update job list (event, ts)
            self.update_joblist(event.src_path, event.event_type, curr_ts)

            # update db (only one job at a time)
            job = self.check_joblist(curr_ts)
            if job is not None:
                self.jobq.put((job, curr_ts))

            #last_ts = time.time()


def watcher(dir='.', pattern=None):
    observer = Observer()
    handler = Handler(pattern)

    handler.start()

    observer.schedule(handler, dir, recursive=True)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()

    observer.join()

if __name__ == '__main__':
    #
    # test
    #
    watcher('/home/sungsooha/Desktop/Data/multiview/tmp')




















