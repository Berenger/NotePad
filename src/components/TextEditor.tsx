import { useState, useEffect, FC } from "react";

interface TextEditorProps {
  pageId: string;
}

const TextEditor: FC<TextEditorProps> = ({ pageId }) => {
  const [text, setText] = useState<string>("");

  useEffect(() => {
    const savedText = localStorage.getItem(`editorText_${pageId}`);
    if (savedText) {
      setText(savedText);
    }
  }, [pageId]);

  useEffect(() => {
    localStorage.setItem(`editorText_${pageId}`, text);
  }, [text, pageId]);

  const getLineNumbers = () => {
    const lineCount = Math.max(text.split("\n").length, 42);
    return Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");
  };

  return (
    <div className="Editor-container">
      <div className="Line-numbers">
        <pre className="Line-number'">{getLineNumbers()}</pre>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="Zone-text"
        placeholder="Start writing here..."
        rows={42}
      />
    </div>
  );
};

export default TextEditor;
