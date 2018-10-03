import React from "react";

import {Input, Button} from "react-toolbox";
import theme from "./index.css";

class ProjectForm extends React.Component {

    handleChange = (label, str) => {
        if (this.props.onChange)
            this.props.onChange(label, str);
    }

    input = (type, label, value, error='', readOnly=false, multiline=false) => {
        return <Input 
            type={type}
            label={label}
            value={value}
            readOnly={readOnly}
            multiline={multiline}
            theme={theme}
            onChange={str => this.handleChange(label, str)}
            error={error.length ? <span>{error}</span>: error}
        />
    }

    input_arr = (type, labels, values, errors, readOnly=false, multiline=false) => {
        const n = labels.length;
        const divStyle = {
            display: 'inline-block',
            width: `${Math.floor(100/n)}%`,
            paddingRight: '5px'
        };
        const inputs = labels.map((label, idx) => {
            return <div style={divStyle}>
                {this.input(type, label, values[idx], errors[idx], readOnly, multiline)}
            </div>
        })
        return <div>{inputs}</div>
    }

    renderButtons = () => {
        const BtnStyle = {
            minWidth: '10px', maxHeight: '10px'
        };
        const {onValidate, onUpdate, errors} = this.props;
        return (
            <div>
                <Button raised style={
                    {...BtnStyle, backgroundColor: errors.valid ? "#00ff00": "#ff0000"}} />
                <Button label="VALIDATE" onClick={onValidate} />
                <Button label="UPDATE DB" onClick={onUpdate} />
            </div>
        );
    }


    render() {
        const { project, errors } = this.props;
        if (project == null) {
            return (
                <div>
                    no project form selected.
                </div>
            );
        }

        const db_labels = ['separator', 'db', 'col'];
        const db_values = db_labels.map(key => project[key]);
        const db_errors = db_labels.map(key => errors[key]);

        const f_labels = ['xml', 'jpg', 'tiff'];
        const f_values = f_labels.map(key => project[key]);
        const f_errors = f_labels.map(key => '');

        return (
            <div>
                {this.renderButtons()}
                <section>
                    {this.input('text', 'author', project.author, errors.author)}
                    {this.input('text', 'filename', project.filename, errors.filename)}
                    {this.input('text', 'name', project.name, errors.name)}
                    {this.input('text', 'path', project.path, errors.path)}
                    {this.input_arr('text', db_labels, db_values, db_errors)}
                    {this.input_arr('text', f_labels, f_values, f_errors, true)}
                    {this.input('text', 'last_updated', project.last_updated, '', true)}
                    {this.input('text', 'description', project.description, '', false, true)}
                </section>
            </div>
        );
    }
}

export default ProjectForm;