import "./button.css"

export default function CloseButton({onClose}) {
    return (
        <div className="Close" onClick={onClose}>
            <span className="top"/>
            <span className="bot"/>
        </div>
    );
}