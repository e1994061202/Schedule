function updateGroupList() {
    const groupListDiv = document.getElementById("groupList");
    groupListDiv.innerHTML = "";
    groupList.forEach((group, index) => {
        const groupDiv = document.createElement("div");
        groupDiv.className = "group";
        groupDiv.setAttribute("data-group-id", group.id);
        groupDiv.innerHTML = `
            <div class="group-header">
                <span class="group-name" onclick="renameGroup(${group.id})">${group.name}${group.isDoubleKing ? ' (雙王版本)' : ''}</span>
                <div class="group-actions">
                    <button onclick="addStaffToGroup(${group.id})">新增人員</button>
                    <button onclick="deleteGroup(${group.id})">刪除群組</button>
                </div>
            </div>
            <div id="staffList-${group.id}"></div>
        `;
        groupListDiv.appendChild(groupDiv);
        updateStaffList(group);
    });

    // 初始化 Sortable
    new Sortable(groupListDiv, {
        animation: 150,
        ghostClass: 'blue-background-class',
        onEnd: function (evt) {
            const groupId = evt.item.getAttribute('data-group-id');
            const newIndex = evt.newIndex;
            
            // 更新 groupList 陣列
            const group = groupList.find(g => g.id == groupId);
            const oldIndex = groupList.indexOf(group);
            groupList.splice(oldIndex, 1);
            groupList.splice(newIndex, 0, group);
            
            saveToLocalStorage();
        }
    });
}
function updateStaffList(group) {
    const staffListDiv = document.getElementById(`staffList-${group.id}`);
    staffListDiv.innerHTML = "";
    group.staffList.forEach((staff) => {
        const staffDiv = document.createElement("div");
        staffDiv.innerHTML = `
            ${staff.name} 
            最小天數: <input type="number" min="1" max="15" value="${staff.minDays}" onchange="updateStaffMinDays(${group.id}, ${staff.id}, this.value)">
            最大天數: <input type="number" min="1" max="15" value="${staff.maxDays}" onchange="updateStaffMaxDays(${group.id}, ${staff.id}, this.value)">
            最多假日天數: <input type="number" min="0" max="8" value="${staff.maxHolidays === null ? '' : staff.maxHolidays}" onchange="updateStaffMaxHolidays(${group.id}, ${staff.id}, this.value)" placeholder="不限制">
            <button onclick="setNoDutyDays(${group.id}, ${staff.id})">不值班日</button>
            <button onclick="setPrescheduledDays(${group.id}, ${staff.id})">預班日</button>
            <button onclick="deleteStaff(${group.id}, ${staff.id})">刪除</button>
            <span class="no-duty-dates" id="no-duty-${group.id}-${staff.id}"></span>
            <span class="prescheduled-dates" id="prescheduled-${group.id}-${staff.id}"></span>
            <div id="calendar-container-${group.id}-${staff.id}" style="display: none;">
                <div id="calendar-${group.id}-${staff.id}"></div>
                <button onclick="confirmDates(${group.id}, ${staff.id})">確認</button>
            </div>
        `;
        staffListDiv.appendChild(staffDiv);
        updateStaffDates(group.id, staff.id);
    });
}

function updateStaffDates(groupId, staffId) {
    const group = groupList.find(g => g.id === groupId);
    const staff = group.staffList.find(s => s.id === staffId);
    
    if (staff.noDutyDates && staff.noDutyDates.length > 0) {
        const sortedNoDutyDates = [...staff.noDutyDates].sort((a, b) => a - b);
        document.getElementById(`no-duty-${groupId}-${staffId}`).textContent = 
            `不值班日期: ${sortedNoDutyDates.join(', ')}`;
    } else {
        document.getElementById(`no-duty-${groupId}-${staffId}`).textContent = '';
    }
    
    if (staff.prescheduledDates && staff.prescheduledDates.length > 0) {
        const sortedPrescheduledDates = [...staff.prescheduledDates].sort((a, b) => a - b);
        document.getElementById(`prescheduled-${groupId}-${staffId}`).textContent = 
            `預班日期: ${sortedPrescheduledDates.join(', ')}`;
    } else {
        document.getElementById(`prescheduled-${groupId}-${staffId}`).textContent = '';
    }
}

function setNoDutyDays(groupId, staffId) {
    setupCalendar(groupId, staffId, 'noDutyDates');
}

function setPrescheduledDays(groupId, staffId) {
    setupCalendar(groupId, staffId, 'prescheduledDates');
}

function setupCalendar(groupId, staffId, dateType) {
    const year = document.getElementById("year").value;
    const month = document.getElementById("month").value;
    const calendarContainer = document.getElementById(`calendar-container-${groupId}-${staffId}`);
    calendarContainer.style.display = 'block';
    
    if (currentFlatpickr) {
        currentFlatpickr.destroy();
    }
    
    const group = groupList.find(g => g.id === groupId);
    const staff = group.staffList.find(s => s.id === staffId);
    
    currentFlatpickr = flatpickr(`#calendar-${groupId}-${staffId}`, {
        mode: "multiple",
        dateFormat: "Y-m-d",
        minDate: `${year}-${month.padStart(2, '0')}-01`,
        maxDate: new Date(year, month, 0),
        defaultDate: staff[dateType] ? staff[dateType].map(day => `${year}-${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`) : [],
        inline: true,
        onChange: function(selectedDates, dateStr, instance) {
            const conflictDates = checkConflictDates(staff, dateType, selectedDates);
            staff[`temp${dateType.charAt(0).toUpperCase() + dateType.slice(1)}`] = selectedDates.map(date => date.getDate());
            
            if (conflictDates.length > 0) {
                const conflictType = dateType === 'noDutyDates' ? '預班日' : '不值班日';
                alert(`警告：以下日期與已設置的${conflictType}衝突：\n${conflictDates.join(', ')}\n\n請注意處理這些衝突。`);
            }
        }
    });
    
    // 儲存當前操作的日期類型
    staff.currentDateType = dateType;
}

function checkConflictDates(staff, currentDateType, selectedDates) {
    const otherDateType = currentDateType === 'noDutyDates' ? 'prescheduledDates' : 'noDutyDates';
    const existingDates = staff[otherDateType] || [];
    
    return selectedDates
        .filter(date => existingDates.includes(date.getDate()))
        .map(date => date.getDate());
}

function confirmDates(groupId, staffId) {
    const group = groupList.find(g => g.id === groupId);
    const staff = group.staffList.find(s => s.id === staffId);
    const dateType = staff.currentDateType;
    
    if (staff[`temp${dateType.charAt(0).toUpperCase() + dateType.slice(1)}`]) {
        let newDates = staff[`temp${dateType.charAt(0).toUpperCase() + dateType.slice(1)}`];
        const otherDateType = dateType === 'noDutyDates' ? 'prescheduledDates' : 'noDutyDates';
        const existingOtherDates = staff[otherDateType] || [];
        
        // 檢查並移除衝突的日期
        const conflictDates = newDates.filter(date => existingOtherDates.includes(date));
        if (conflictDates.length > 0) {
            const conflictType = dateType === 'noDutyDates' ? '預班日' : '不值班日';
            const confirmMessage = `以下日期與已設置的${conflictType}衝突：\n${conflictDates.join(', ')}\n\n是否要從${conflictType}中移除這些衝突的日期？`;
            
            if (confirm(confirmMessage)) {
                staff[otherDateType] = existingOtherDates.filter(date => !conflictDates.includes(date));
            } else {
                // 如果用戶選擇不移除衝突日期，則從新選擇的日期中移除衝突日期
                newDates = newDates.filter(date => !conflictDates.includes(date));
            }
        }
        
        staff[dateType] = newDates.sort((a, b) => a - b);
        delete staff[`temp${dateType.charAt(0).toUpperCase() + dateType.slice(1)}`];
    }
    
    updateStaffDates(groupId, staffId);
    document.getElementById(`calendar-container-${groupId}-${staffId}`).style.display = 'none';
    
    if (currentFlatpickr) {
        currentFlatpickr.destroy();
        currentFlatpickr = null;
    }
    
    delete staff.currentDateType;
    saveToLocalStorage();
}

function displayScheduleResult(year, month, groupSchedules, unfulfilled) {
    const resultDiv = document.getElementById("scheduleResult");
    resultDiv.innerHTML = '';

    const daysInMonth = new Date(year, month, 0).getDate();
    
    let tableHTML = `
        <h3>${year}年${month}月排班表</h3>
        <table>
            <tr>
                <th>日期 (星期)</th>
                ${groupList.map(group => `<th>${group.name}</th>`).join('')}
            </tr>
    `;

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
        tableHTML += `
            <tr>
                <td>${day} (${dayOfWeek})</td>
                ${groupList.map(group => `<td>${groupSchedules[group.id][day-1] || '未排班'}</td>`).join('')}
            </tr>
        `;
    }

    tableHTML += `</table>`;
    resultDiv.innerHTML = tableHTML;

    if (unfulfilled.length > 0) {
        const unfulfilledDiv = document.createElement('div');
        unfulfilledDiv.innerHTML = `<p>警告：以下人員未達到最小值班天數：${unfulfilled.join(', ')}</p>`;
        resultDiv.appendChild(unfulfilledDiv);
    }
}

function displayStatistics(groupStaffWorkDays) {
    const statisticsDiv = document.getElementById("statisticsResult");
    statisticsDiv.innerHTML = '<h3>值班統計</h3>';

    groupList.forEach(group => {
        const staffWorkDays = groupStaffWorkDays[group.id];
        
        let groupTableHTML = `
            <h4>${group.name}</h4>
            <table>
                <tr>
                    <th>人員</th>
                    <th>總值班日數</th>
                    <th>平日班數</th>
                    <th>假日班數</th>
                </tr>
        `;

        group.staffList.forEach(staff => {
            const workDays = staffWorkDays[staff.id];
            groupTableHTML += `
                <tr>
                    <td>${staff.name}</td>
                    <td>${workDays.total}</td>
                    <td>${workDays.weekdays}</td>
                    <td>${workDays.holidays}</td>
                </tr>
            `;
        });

        groupTableHTML += `</table>`;
        
        const groupDiv = document.createElement('div');
        groupDiv.innerHTML = groupTableHTML;
        statisticsDiv.appendChild(groupDiv);
    });
}

function renameGroup(groupId) {
    const group = groupList.find(g => g.id === groupId);
    if (group) {
        const newName = prompt("請輸入新的群組名稱：", group.name);
        if (newName && newName !== group.name) {
            group.name = newName;
            updateGroupList();
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

function updateStaffMinDays(groupId, staffId, value) {
    const group = groupList.find(g => g.id === groupId);
    const staff = group.staffList.find(s => s.id === staffId);
    staff.minDays = parseInt(value);
    saveToLocalStorage();
}

function updateStaffMaxDays(groupId, staffId, value) {
    const group = groupList.find(g => g.id === groupId);
    const staff = group.staffList.find(s => s.id === staffId);
    staff.maxDays = parseInt(value);
    saveToLocalStorage();
}

function updateStaffMaxHolidays(groupId, staffId, value) {
    const group = groupList.find(g => g.id === groupId);
    const staff = group.staffList.find(s => s.id === staffId);
    staff.maxHolidays = value === '' ? null : parseInt(value);
    saveToLocalStorage();
}

function deleteStaff(groupId, staffId) {
    const group = groupList.find(g => g.id === groupId);
    if (group) {
        const staffName = group.staffList.find(s => s.id === staffId).name;
        if (confirm(`確定要刪除 ${staffName} 嗎？`)) {
            group.staffList = group.staffList.filter(staff => staff.id !== staffId);
            updateStaffList(group);
            saveToLocalStorage();
        }
    }
}