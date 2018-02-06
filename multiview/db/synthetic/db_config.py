MONGODB_CONFIG = {
    'ROOT': '/Users/scott/Documents/Work/bnl/code/app/react-multiview/multiview/db/data/synthetic/',

    # mongo db set-up
    'DB': {
        'HOST': 'localhost',
        'PORT': 27017,
        'NAME': 'multiview_synthetic',
        'COLLECTION': 'synthetic'
    },

    # parsing xml file
    'XML': {
        # root directory relative to ROOT
        'DIR': '00000001_image/analysis/results/',

        # sample name split (unused)
        'SAMPLE_SPLIT': '_th0',

        # for same protocol
        'TIMESTAMP': 'save_timestamp',

        # id field
        'ROOTID': 'name', # root
        'PID': 'name',    # protocol
        'RID': 'name',    # result
        'RVAL': 'value',  # result value

        # fields that will be ignored in a protocol
        'P_EXCLUDE': [
            'infile',
            'outfile',
            'output_dir',
            'runtime',
        ],

        # fields that will be excluded in a result
        'R_EXCLUDE': [
            'filebase',
            'file_access_time',
            'sample_name',
            'file_ctime',
            'file_size',
            'infile',
            'filepath',
            'filename',
            'fileext',
            'file_modification_time'
        ],

        # fields whose value will be considered as string
        'R_STRING': [

        ],
    },
    'THUMBNAIL': {
        'SAVE': True,
        'DIR': '00000001_image/analysis/thumbnails/',
        'EXT': ['', '.jpg', '.png']
    }
}