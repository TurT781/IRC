import React from "react";
import { Link } from 'react-router-dom';
import "../CSS/Commands.css";
const Commands = () => {
    return (
        <main className="main">
            <div className="pagesCommands">
                <div className="content">
                    <p className="textCommands"> <strong>/nickname [Your_Name]</strong> :
                        allows you to change your username as many times as you want</p><br />
                    <hr />
                    <p className="textCommands"> <strong>/users</strong> : List all Users connected to the Server </p><hr />
                </div>
            </div>
            <div className="boxBtn">
                <Link className="LinkHome" to="/" >
                    <button className="btnHome" onClick={() => window.location.href = "/"}>
                        Server
                    </button>
                </Link>
            </div>
        </main>
    );
};
export default Commands;