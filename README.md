# MultiSciView

MultiSciView is an interactive visualization tool to explore and visualize large-scale data in which each data datum consists of multivariate attributes and an image. This tool is initially developed for X-ray images (high-resolution and -dynamic-range) obtained from synchrotron beamlines that are typically associated with a variety of metadata, but its utilization is not limited to specific data kinds.

## Contents
- [Structures](#structures)
- [Installation](#installation)
    - [For Front-end Developers](#installa)
    - [For Back-end Developers](#installb)
- [Run MultiSciView](#run)
    - [STEP 1: Build database with MongoDB](#step1)
    - [STEP 2: Run a web server](#step2)
- [Play MultiSciView](#play)

## [Structures](#structures)
- config: containing config files for webpack
- docs: containing MultiSciView application javascript files
- multiview: containing back-end web server (including bundled javascript codes) for MultiSciView application 
- src/lib: containing low-level javascript library for interative visualization

## [Installation](#installation)
Download (or clone) this repository containing, then ...

### [For Front-end Developers](#installa)
1. Install nodejs v6.x (with higher version, it may fail to compile codes), and then
2. type ```npm install``` to install all required packages
3. type ```npm run apptest``` for developing (webpack watch mode)

Note that in watch mode it will automatically detect any changes under **/docs** and **/src** folders and output bundled files in **/multiview/static/js** folder. Webpack configuration can be found in **/config** folder.

### [For Back-end Developers](#installb)
Flask and Flask-restful are used for the back-end. Required python packages are listed in **/multiview/requirements.txt**.

## [Run MultiSciView](#run)
Assuming users pre-compiled (or in webpack watch mode) and saved bundled javascript files in **/multiview/static/js** and corresponding html files in **/multiview/templates**. Without any changes in webpack configuration settings (or from this repository), you may have **react-multiview-home.js** and **react-multiview-documentation.js** bundled javascript files, and **index.html** and **documentation.html** html files. Note that files containing **documentation** word is reserved for the future usage. For now, it does not have any effects on running the tool, MultiSciView. 

### [STEP 1: Build database with MongoDB](#step1) 
The first step is to construct and run your database on a server or a local machine. To construct a database with your own database, we provide a python script named **/multiview/multiviewdb.py**. You can build your own database by running the script in python. 

The script assumes that for each data point to visualize you have one **.xml** file containing metadata information and one **.tiff** file for a X-ray image. It further assumes the structure of the xml file as followings:
```xml
<DataFile name="path/path/tiff-file-name.tiff" ... other fields ...>
    <protocol name="protocol-name" ... other fields ...>
        <result name="metadata-name" value="metadata-value" />
        ... other result tags ...
    </protocol>
    ... other protocol tags ...
</DataFile>
```  
Note that in the above xml template it only shows required fields in each tag. Additional fields can be freely added and configured what fields will be included (or excluded) in a configuration file. An example for the configuration file can be found in **/multiview/db/saxs_v2/db_config.py** in which you can also specify your data location and MongoDB parameters as following:
```python
MONGODB_CONFIG = {
    'ROOT': 'absolute path to root directory of your data',
    'DB': {
        'HOST': 'localhost',         # host name
        'PORT': 27017,               # port number
        'NAME': 'multiview_saxs_v2', # DB name
        'COLLECTION': 'saxs_v2'      # Collection name
    },
    'XML': {
        'DIR': 'path to a directory for xml files w.r.t ROOT',
        'SAMPLE_SPLIT': '_th0.',        # a keyword to split same name (or tiff file name)
        'TIMESTAMP': 'save_timestamp',  # field name for time stamp
        'ROOTID': 'name',               # field name for DataFile tag ID
        'PID': 'name',                  # field name for protocol tag ID
        'RID': 'name',                  # field name for result tag ID
        'RVAL': 'value',                # filed name for result tag value
        'P_EXCLUDE': [...]              # list of field names to ignore in protocol tag
        'R_EXCLUDE': [...]              # list of field names to ignore in result tag
    },
    'TIFF': {
        'SAVE': True,          # save X-ray image ?
        'EXT': ['', '.tiff'],  # list of extension of X-ray image
        'DIR': 'path to a directory for X-ray image files w.r.t ROOT'
    },
    ... 
}
```
Note that for more configuable parameters and detailed descriptions, see the example config file under **/multiview/db/**. One can readily modify **/multiview/multiviewdb.py** files to support different structures of a xml file and image-like data. Please contact to authors for more details.

### [STEP 2: Run a web server](#step2)
We also provide a python script to run a web server powered by [Flask](http://flask.pocoo.org/) and [Flask-RESTful](https://flask-restful.readthedocs.io/en/latest/). One can find the script in **/multiview/app.py**. To run the script properly, one needs to modify two things. First, user need to import appropriate database configuration file, which is created in [STEP 1](#step1)( for example, **/multiview/db/saxs_v2/db_config.py**) as following:
```python
from db.saxs_v2.db_config import MONGODB_CONFIG
``` 
The other thing is to modify host name and port number for the web server as following:
```python
SERVER_HOST = 'localhost'
SERVER_PORT = 8001
```
Executing the python script file will launch the web server and user can access to MultiSciView tool at [http://localhost:8001/](). To be visible across the internal network, user can set the host as follows:
```python
SERVER_HOST = '0.0.0.0'
```

## [Play MultiSciView](#play)

### Select samplessssssssssssssssssssssssssssssssssssss


[overview]: https://github.com/ComputationalScienceInitiative/react-multiview/blob/master/img/overview.png






