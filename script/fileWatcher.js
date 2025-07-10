function updateFileList() {
    const fileListContainer = document.getElementById("file-list"); 
    if (!fileListContainer) return;

    window.electron.invoke("get-excel-files").then((files) => {
        fileListContainer.innerHTML = ""; //

        if (!files || files.length === 0) {
            fileListContainer.innerHTML = "<div>File Excel not find</div>";
            return;
        }

        files.forEach((file) => {
            const fileElement = document.createElement("div");
            fileElement.classList.add("file-item");

            fileElement.innerHTML = `
                <div class="button-container">
                <span class="file-name">${file.name}</span>
                <button class="download-btn">Download</button>
                <button class="delete-btn">Delete&nbsp;<span class="delete">x</span></button>
                </div>
            `;
            fileElement.querySelector(".download-btn").addEventListener("click", async () => {
                const result = await window.electron.invoke("download-file", file.path);
                alert(result);
            });
            fileElement.querySelector(".delete-btn").addEventListener("click", async () => {
                const result = await window.electron.invoke("delete-file", file.path);
                alert(result);
                updateFileList(); //
            });
            fileListContainer.appendChild(fileElement);
        });
    }).catch((error) => {
        console.error("Error reload:", error);
    });
}
// 
setInterval(updateFileList, 5000);
// 
updateFileList();
