# MultiSciView

MultiSciView is an interactive visualization tool to explore and visualize large-scale data in which each data datum consists of multivariate attributes and an image. This tool is initially developed for X-ray images (high-resolution and -dynamic-range) obtained from synchrotron beamlines that are typically associated with a variety of metadata, but its utilization is not limited to specific data kinds.

<video width="500" height="300" controls=true allowfullscreen=true>
    <source src="img/html5-demo.mp4" type="video/mp4"></source>
    <p>Your browser does not support the video element.</p>
</video>



## Contents
1. [Structures](#1-structures)
2. [Installation](#2-installation)
    - [For Front-end Developers](#for-front-end-developers)
    - [For Back-end Developers](#for-back-end-developers)
3. [Run MultiSciView](#run-multisciview)
    - [STEP 1. Build database with MongoDB](#step-1-build-database-with-mongodb)
    - [STEP 2. Run a web server](#step-2-run-a-web-server)
3. [Play MultiSciView](#3-play-multisciview)
    - [Scatter plot](#scatter-plot)
    - [Data panel](#data-panel)
    - [Axis panel](#axis-panel)
    - [Image panel](#image-panel)
    - [Parallel Coordinate Plot (PCP) panel](#pcp-panel)
    - [Data picker](#data-picker)
4. [Authors](#4-authors)
5. [License](#5-license)

## [1. Structures](#1-structures)
- config: containing config files for webpack
- docs: containing MultiSciView application javascript files
- multiview: containing back-end web server (including bundled javascript codes) for MultiSciView application 
- src/lib: containing low-level javascript library for interative visualization

## [2. Installation](#2-installation)
Download (or clone) this repository containing, then ...

### [For Front-end Developers](#for-front-end-developers)
1. Install nodejs v6.x (with higher version, it may fail to compile codes), and then
2. type ```npm install``` to install all required packages
3. type ```npm run apptest``` for developing (webpack watch mode)

Note that in watch mode it will automatically detect any changes under **/docs** and **/src** folders and output bundled files in **/multiview/static/js** folder. Webpack configuration can be found in **/config** folder.

### [For Back-end Developers](#for-back-end-developers)
Flask and Flask-restful are used for the back-end. Required python packages are listed in **/multiview/requirements.txt**.

## [Run MultiSciView](#run-multisciview)
Assuming users pre-compiled (or in webpack watch mode) and saved bundled javascript files in **/multiview/static/js** and corresponding html files in **/multiview/templates**. Without any changes in webpack configuration settings (or from this repository), you may have **react-multiview-home.js** and **react-multiview-documentation.js** bundled javascript files, and **index.html** and **documentation.html** html files. Note that files containing **documentation** word is reserved for the future usage. For now, it does not have any effects on running the tool, MultiSciView. 

### [STEP 1. Build database with MongoDB](#step-1-build-database-with-mongodb) 
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

### [STEP 2. Run a web server](#step-2-run-a-web-server)
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

## [3. Play MultiSciView](#3-play-multisciview)
The MultiSciView largely consists of two parts. One part is to visualize data in scatter plot and the other part is a control panel. In the control panel, users can select data to be visualized in the scatter plot with selected two attributes. There are variety of color schemes users can select based on sample name or selected attributes and the range of color scheme can be interactively changed. Data points can be replaced with X-ray images with user interaction and the scatter plot can be zoomed-in until the pixel level of the images. Users also can select a color scheme and control its dynamic ranges, interactively. Finally, MultiSciView provides parallel coordinate plot that is connected with the scatter plot so that users can easily navigate (selected) attribute space and investigate their correlations. Furthermore, the parallel coordinate plot can be utilzed to filter some data points out from the scatter plot so that users can easily concentrate on the regions of interests in each attributes. In the following, we will describe how these functionalities is interactively used by users.  

<figure>
    <img src="img/overview.png" alt="fig:overview">
    <figcaption>Overview of MultiSciView</figcaption>
</figure>

### [Scatter plot](#scatter-plot)
In the scatter plot, it supports smooth zoom in/out and translation of the data axis. More specifically, in wide data range, users might observe data patterns (or clusters) over lots of points. Using the mouse wheel or dragging one of axies, users can smoothly zoom in to the regions of interests. Users can also trigger to turn the data points into X-ray images and images over different data points can be compared. When there are interesting phenamenan in an image, users can further zoom in upto the pixel level and check its numerical value in each pixel. Within the scatter plot, there are many user interactions allowing users to explore large-scale high-dimensional data more efficiently as described in the following subsections.   

<figure>
    <img src="img/scatter.png" width="500" alt="fig:scatter">
    <figcaption>Multi-levle data exploration in scatter plot</figcaption>
</figure>


### [Data panel](#data-panel)
In the data panel, users can select (or query) from the connected database and delete samples from the visualization. All data can be selected or deleted by clicking a button on the top of the panel. Or, users can query specific samples containing user provided keyword using the searching box. Then, matched sample names will appear in the drop-down menu. Selected samples are listed below the searching box with randomly selected colors for each sample (colored rectangle box next to sample names) and the color can be used for any data visualizations in the tool. By clicking the box, users can change colors for each sample and clicking trash icons allows users deleting specific samples and corresponding data points from any data visualizations in the tool. 

<figure>
    <img src="img/data-panel.png" width="400" alt="fig:data-panel">
    <figcaption>Data panel</figcaption>
</figure>

### [Axis panel](#axis-panel)
In the axis panel, users can select three attributes and a color schemes for the scatter. The first two attributes are for the x- and y-axis of the scatter plot and the third attribute is for the color encoding of the plot. For the color encoding, we provide a variaty of color schemes and users can easily control the range of a color scheme by dragging handlers (red colored triangles above the color bar). All attributes and a color scheme can be easily selected using the dropdown menu. Note that the color encoding scheme selected in this panel is also applied to the parallel coordinate plot for the consistency.

<figure>
    <img src="img/axis-panel.png" width="450" alt="fig:axis-panel">
    <figcaption>Axis panel</figcaption>
</figure>


### [Image panel](#image-panel)
In the image panel, using a button labeled 'SHOW IMAGE', users can trigger to show X-ray images instead of data points in the scatter plot. There are one additional control parameter to show the images corresponding each data point in the scatter plot. It is the minimum number of data points appeared in the scatter plot that can be controlled by the slider right below the button. The other slider in the panel can be used to set initial image side. As the size of images is dynamically changing according to user interactions (zoom in/out via mouse wheel), it will not give an effect if the current image size is larger than the value set by the slider. Lastly, users can select a color scheme from the dropdown menu and change the dynamic range of images using the handlers in the color bar like the way in the [axis panel](#axis-panel).

<figure>
    <img src="img/image-panel.png" width="450" alt="fig:image-panel">
    <figcaption>Image panel</figcaption>
</figure>



### [PCP panel](#pcp-panel)
In the parallel coordinate plot (PCP) panel, users can explore the selected data using PCP. There are two interactions users can apply to the PCP. First, users can change the order of axies by dragging each axis by mouse. This will help to reveal the correlations among the selected attributes. The other interaction is to filter data points out by selecting range of interests in each attribute axis. As the PCP is tightly connected to the scatter plot, the change of the range will dynamically change the scatter plot. In addition, an attributes used for the color encoding is selected and the change will be also applied to the scatter plot (and [vise versa](#axis-panel)). Lastly, users can add or delete available data attributes in this panel.

<figure>
    <img src="img/pcp-panel.png" width="550" alt="fig:pcp-panel">
    <figcaption>PCP panel</figcaption>
</figure>

### [Data picker](#data-picker)
As an auxiliary feature, MultiSciView provides an easy way to review all attributes and the corresponding X-ray image of a data point. It can be done by simply cliking one of data points in the scatter plot and that will pop up an window. In the scatter plot, it will set a flag with a id number to indicate this data point is in the data picker (the pop-up window). Consequtive clicking on the data points will add those data points into the internal array and users can see all details of them using the data picker. In the data picker, it largely consists of two parts. In the upper part, users can review a X-ray image of one of picked data point by translating or zooming in/out upto pixel level. In the bottom part, users can review details of all attributes the picked data point has. In case when there are multiple picked data points, users can navigate them either by clicking next or previous buttons (black colored triangle buttons in the upper part) or by clicking flags in the scatter plot. 

<figure>
    <img src="img/datapicker.png" width="250" alt="fig:datapicker">
    <figcaption>Data picker</figcaption>
</figure>

## [4. Authors](#4-authors)
Sungsoo Ha (hasungsoo@gmail.com, sungsooha@bnl.gov)

## [5. License](#3-license)

















