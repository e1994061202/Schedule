function addGroup() {
    const name = prompt("請輸入群組名稱：");
    if (name) {
        const group = {
            id: Date.now(),
            name: name,
            staffList: [],
            isDoubleKing: false  // 新增屬性，標記是否為雙王版本
        };
        groupList.push(group);
        updateGroupList();
        saveToLocalStorage();
    }
}

function addDoubleKingGroup() {
    const name = prompt("請輸入雙王版本群組名稱：");
    if (name) {
        const group = {
            id: Date.now(),
            name: name,
            staffList: [],
            isDoubleKing: true  // 標記為雙王版本
        };
        groupList.push(group);
        updateGroupList();
        saveToLocalStorage();
    }
}


function addStaffToGroup(groupId) {
    const group = groupList.find(g => g.id === groupId);
    if (group) {
        const name = prompt("請輸入人員姓名：");
        if (name) {
            const staff = {
                id: Date.now(),
                name: name,
                minDays: 5,  // 默認最小值班數為5天
                maxDays: 15,
                maxHolidays: null,
                noDutyDates: [],
                prescheduledDates: []
            };
            group.staffList.push(staff);
            updateStaffList(group);
            saveToLocalStorage();
        }
    }
}

function deleteGroup(groupId) {
    if (confirm("確定要刪除這個群組嗎？")) {
        groupList = groupList.filter(group => group.id !== groupId);
        updateGroupList();
        saveToLocalStorage();
    }
}

function deleteAllGroups() {
    if (confirm("確定要刪除所有群組嗎？此操作無法撤銷。")) {
        groupList = [];
        updateGroupList();
        saveToLocalStorage();
    }
}