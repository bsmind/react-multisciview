import React from "react";
import axios from "axios";

import {Button} from "react-toolbox/lib/button";
import {Dialog, Input, Checkbox} from "react-toolbox";
import {List, ListItem, ListSubHeader, ListDivider, ListCheckbox} from "react-toolbox/lib/list";

import ProjectForm from "./form";
import theme from './index.css';

const project_template = {
    'valid': 'false',
    'filename': '',
    'name': 'new project',
    'path': '',
    'separator': '',
    'db': '',
    'col': '',
    'description': '',
    'last_updated': '',
    'author': '',
    'xml': '0/0',
    'jpg': '0/0',
    'tiff': '0/0'
};

const error_template = {
    'filename': 'required',
    'name': '',
    'path': 'invalid path',
    'separator': 'required',
    'db': 'required',
    'col': 'required',
    'author': 'required'
};

class DataMgrView extends React.Component {
    constructor() {
        super();
        this.state = {
            isOpen: false,
            projects: [],
            errors: [],
            selected_idx: -1,
        };

        this.interval = null;
    }

    get_selected_project = () => {
        if (this.state.projects.length == 0) return null;
        return this.state.projects[this.state.selected_idx];
    }

    get_selected_error = () => {
        if (this.state.errors.length == 0) return null;
        return this.state.errors[this.state.selected_idx];
    }

    componentDidMount() {
        //this.getProject();
        // initialize 
        //console.log('componentDidMount');
    }

    componentWillUnmount() {
        //console.log('componentWillUnmount');
    }

    // to be deleted
    getProject = (action='get', project=null, idx=-1) => {
        const payload = {
            action,
            project
        }
        axios.post('/api/project', payload)
            .then(resp => {
                if (action === 'get') {
                    this.setState({projects: [...resp.data]})
                } else if (action == 'check' && idx>=0) {
                    const projects = [...this.state.projects];
                    projects[idx] = {...resp.data};
                    this.setState({projects});
                }
            })
            .catch(e => {
                console.log(e);
            });
    }

    // simple validation
    // this might cause an error when
    // 1. request validation and takes time ...
    // 2. while waiting the response from the server, index changes
    //    (add/delete new project before)
    // todo: how to prevent from the error??
    validateProject = (e) => {
        //console.log('validateProject')
        // fields that shouldn't be empty
        const idx = this.state.selected_idx;
        const form = this.get_selected_project();
        const error = {
            'author': form.author.length ? '': 'required',
            'filename': form.filename.length ? '': 'required',
            'name': form.name.length ? '': 'required',
            'separator': form.name.length ? '': 'required',
            'db': form.db.length ? '': 'required',
            'col': form.col.length ? '': 'required'
        }
        // check path if it exists in the server
        if (form.path.length == 0) {
            error['path'] = 'required';
            const errors = [...this.state.errors];
            errors[idx] = {...error, valid: false};

            form['valid'] = 'false';
            const projects = [...this.state.projects];
            projects[idx] = form;
            this.setState({errors, projects});
        } else {
            axios.post('/api/project/validate', {'path': form.path})
                .then(resp => {
                    error['path'] = resp.data;
                    let isValid = true;
                    Object.keys(error).forEach(key => {
                        if (error[key].length)
                            isValid = false;
                    });
                    const errors = [...this.state.errors];
                    errors[idx] = error;

                    form['valid'] = isValid ? 'true': 'false';
                    const projects = [...this.state.projects];
                    projects[idx] = form;
        
                    this.setState({errors, projects});
                })
                .catch(e => {
                    console.log('validateProject: ', e);
                });
        }
    }

    // add new (empty) project form
    addNewProject = (e) => {
        const projects = [...this.state.projects];
        const errors = [...this.state.errors];
        
        let count = 0;
        projects.forEach(p => {
            if (p.name.includes('new project'))
                count += 1;
        });
        const name = count ? `new project ${count}`: 'new project';
        projects.push({...project_template, name});
        errors.push({...error_template});

        this.setState({
            projects, errors,
            selected_idx: projects.length - 1,
        });
    }

    // delete a project form
    delProject = (e) => {
        if (this.state.projects.length == 0) return;
        if (this.state.selected_idx < 0) return;

        let idx = this.state.selected_idx;
        const projects = [...this.state.projects];
        const errors = [...this.state.errors];
        projects.splice(idx, 1);
        errors.splice(idx, 1);

        if (projects.length == 0) {
            idx = -1;
        } else {
            idx = Math.max(0, idx - 1);
        }
        
        this.setState({projects, errors, selected_idx: idx});
    }

    // load a project form from a local disk (client side)
    onProjectLoad = (e) => {
        const form = JSON.parse(e.target.result);
        const projects = [...this.state.projects];
        const errors = [...this.state.errors];
        projects.push({...form});
        errors.push({...error_template});

        this.inputFile.value = '';
        this.setState({
            projects, errors,
            selected_idx: projects.length - 1,
        });
    }
    loadProject = (e) => {
        e.preventDefault();
        const reader = new FileReader();
        reader.onload = this.onProjectLoad;
        reader.readAsText(e.target.files[0]);
    }

    // save (download) a project to a local dist (client side)
    saveProject = (e) => {
        const selected_idx = this.state.selected_idx;
        if (selected_idx < 0) return;

        const project = this.state.projects[selected_idx];
        const blob = new Blob(
            [JSON.stringify(project, null, 4)], {
                type: 'application/octet-stream'
            }
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', project.filename);
        link.click();
        URL.revokeObjectURL(url);
    }

    // toggle project list & form dialog
    handleToggle = () => {
        const isOpen = this.state.isOpen;

        if (isOpen && this.props.updateProjects)
        {
            this.props.updateProjects(this.state.projects);
        }
        this.setState({isOpen: !this.state.isOpen});
    }

    // change selected project
    handleProjectClick = (idx) => {
        this.setState({selected_idx: idx});
    }

    // handle modification in a project form
    handleProjectChange = (field, value) => {
        const {selected_idx} = this.state;
        if (selected_idx < 0) return;
        
        const projects = [...this.state.projects];
        projects[selected_idx][field] = value;
        projects[selected_idx]['valid'] = 'false';
        this.setState({projects});
    }

    // request populating DB
    // assume all projects have unique project name
    find_project_idx = (p) => {
        const projects = this.state.projects;
        let idx = -1;
        for (let i=0; i<projects.length; i++){
            if (projects[i].name == p.name) {
                idx = i;
                break;
            }
        }
        return idx;
    }

    updateProgress = () => {
        axios.post('/api/sync/progress')
            .then(resp => {
                const projectsInUpdate = resp.data;
                const projects = [...this.state.projects];
                let flag = false;
                for (let i = 0; i < projects.length; i++) 
                    for (let j = 0; j < projectsInUpdate.length; j++) 
                        if (projects[i].name === projectsInUpdate[j].name) {
                            projects[i] = projectsInUpdate[j];
                            flag = true;
                        }
                if (flag) {
                    this.setState({projects}, () => {
                        if (this.props.updateProjects)
                            this.props.updateProjects(this.state.projects);
                    });
                } else {
                    console.log('[DEBUG] clear interval');
                    clearInterval(this.interval);
                    this.interval = null;
                }
            })
            .catch(e => {
                console.log('[ERROR] updateProgress: ', e);
            });
    }

    handleUpdateDB = (e) => {
        e.stopPropagation();
        const project = this.get_selected_project();
        axios.post('/api/sync/request', project)
            .then(resp => {
                const after = resp.data;
                const {projects} = this.state;
                const idx = this.find_project_idx(after);
                if (idx >= 0) {
                    projects[idx] = after;
                    this.setState({projects: [...projects]}, () => {
                        if (this.interval == null) {
                            this.interval = setInterval(this.updateProgress, 10000);
                        }
                    });
                }
            })
            .catch(e => {
                console.log('[ERROR] handleUpdateDB: ', e);
            });
    }

    renderPage = () => {
        const BtnStyle = {
            minWidth: '10px', maxHeight: '10px'
        };
        const project_items = this.state.projects.map( (p, idx) => {
            
            const status = p.hasOwnProperty('status') ? p['status']: null;
            const progress = p.hasOwnProperty('progress') ? p['progress']: 0;
            const msg = status ? `${status} (${progress}%)`: "";

            return <ListItem
                key={`${idx}-${p.name}`}
                caption={p.name}
                leftActions={[
                    <Button raised style={{...BtnStyle, 
                        backgroundColor: idx === this.state.selected_idx ? "#000000": "#ffffff"}}/>
                ]}
                rightActions={[
                    <span style={{fontSize: '12px', color: 'red'}}>{msg}</span>
                ]}
                onClick={e => this.handleProjectClick(idx)}
                theme={theme}
            />
        });

        return (
            <div>
                <div style={{
                    float: 'left',
                    display: 'inline-block',
                    width: '44%',
                    height: '370px',
                    overflowY: "scroll",
                    borderRadius: '10px',
                    border: '1px dotted #707070',
                    marginRight: '5px',
                    padding: '0px 5px 0px 5px'
                }}>
                    <Button label="NEW" onClick={this.addNewProject} />
                    <Button label="DELETE" onClick={this.delProject} />
                    <Button label="SAVE" onClick={this.saveProject} />
                    <input ref={ref => this.inputFile=ref} 
                        type="file" name="file" id="file" multiple={false} 
                        onChange={this.loadProject}
                        className={theme.inputfile}
                    />
                    <label for="file" >Choose a file</label>
                    <List selectable ripple>
                        {project_items}
                    </List>
                </div>
                <div style={{
                    float: 'right',
                    display: 'inline-block',
                    width: '55%',
                    height: '370px',
                    overflowY: "scroll",
                    borderRadius: '10px',
                    border: '1px dotted #707070',
                    padding: '0px 5px 0px 5px'
                }}>
                    <ProjectForm 
                        project={this.get_selected_project()}
                        errors={this.get_selected_error()}
                        onValidate={this.validateProject}
                        onChange={this.handleProjectChange}
                        onUpdate={this.handleUpdateDB}
                    />
                </div>
            </div>
        );
    }

    render() {
        return (
            <div style={{display: 'inline-block'}}>
                <Button 
                    label='Open Data Manager'
                    onClick={this.handleToggle}
                />
                <Dialog
                    active={this.state.isOpen}
                    onEscKeyDown={this.handleToggle}
                    onOverlayClick={this.handleToggle}
                    title="Data Manager"
                    type="normal"
                    theme={theme}
                >
                    {this.renderPage()}
                </Dialog>
            </div>
        );
    }
}

export default DataMgrView;