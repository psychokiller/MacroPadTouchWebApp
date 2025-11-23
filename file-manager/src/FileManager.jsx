import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

const bytesToHumanReadable = (bytes) => {
  if (bytes === 0) return '0 B';
  const suffixes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${suffixes[i]}`;
};

export const FileManager = () => {
  const [files, setFiles] = useState([]);

  const fetchFiles = () => {
    fetch('/list')
      .then(response => response.json())
      .then(data => setFiles(data));
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = (event) => {
    event.preventDefault();
    const fileInput = event.target.querySelector('input[type="file"]');
    if (!fileInput.files[0]) {
      alert("Please select a file to upload.");
      return;
    }
    const formData = new FormData(event.target);
    fetch(`/upload?filename=${fileInput.files[0].name}`, {
      method: 'POST',
      body: formData,
    }).then((response) => {
      if (response.ok) {
        fetchFiles();
        event.target.reset(); // Clear the form
      } else {
        alert("Upload failed.");
      }
    });
  };

  const handleDelete = (filename) => {
    if (confirm(`Are you sure you want to delete ${filename}?`)) {
      fetch(`/delete?file=${filename}`, {
        method: 'POST',
      }).then((response) => {
        if (response.ok) {
          fetchFiles();
        } else {
          alert("Delete failed.");
        }
      });
    }
  };

  return (
    <div>
      <h2>Upload File</h2>
      <form onSubmit={handleUpload}>
        <input type="file" name="file" />
        <button type="submit" class="action-button">Upload</button>
      </form>

      <h2>Existing Files</h2>
      <table class="file-list">
        <thead>
          <tr>
            <th>Filename</th>
            <th>Size</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map(file => (
            <tr key={file.name}>
              <td><a href={`/download?file=${file.name}`} download={file.name}>{file.name}</a></td>
              <td>{bytesToHumanReadable(file.size)}</td>
              <td>
                <button class="action-button" onClick={() => handleDelete(file.name)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
