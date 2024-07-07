function saveToLocalStorage() {
    localStorage.setItem('groupList', JSON.stringify(groupList));
    localStorage.setItem('selectedMonth', document.getElementById("month").value);
}

function loadFromLocalStorage() {
    const savedGroupList = localStorage.getItem('groupList');
    if (savedGroupList) {
        groupList = JSON.parse(savedGroupList);
        updateGroupList();
    }
    
    const savedMonth = localStorage.getItem('selectedMonth');
    if (savedMonth) {
        document.getElementById("month").value = savedMonth;
    }
}
function saveData() {
    const dataStr = JSON.stringify(groupList);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'schedule_data.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function loadData() {
    document.getElementById('fileInput').click();
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                groupList = JSON.parse(e.target.result);
                updateGroupList();
                saveToLocalStorage();
                alert('資料已成功載入');
            } catch (error) {
                alert('載入失敗，請確保文件格式正確');
            }
        };
        reader.readAsText(file);
    }
}