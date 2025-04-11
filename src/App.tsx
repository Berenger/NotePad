import React, { FC } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from "react-router-dom";
import Header from "./components/Header";
import TextEditor from "./components/TextEditor";
import { v4 as uuidv4 } from "uuid";

const RedirectToNewPage: FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    const newId = uuidv4().slice(0, 8);
    navigate(`/${newId}`);
  }, [navigate]);

  return null;
};

const DynamicTextEditor: FC = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <Header />
      <div className="App-note">
        <TextEditor pageId={id!} />
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RedirectToNewPage />} />
        <Route path="/:id" element={<DynamicTextEditor />} />
      </Routes>
    </Router>
  );
};

export default App;
