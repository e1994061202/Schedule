function updateStaffList(group) {
    const staffListDiv = document.getElementById(`staffList-${group.id}`);
    staffListDiv.innerHTML = "";
    group.staffList.forEach((staff) => {
        const staffDiv = document.createElement("div");
        staffDiv.innerHTML = `
            ${staff.name} 
            最小天数: <input type="number" min="1" max="15" value="${staff.minDays}" onchange="updateStaffMinDays(${group.id}, ${staff.id}, this.value)">
            最大天数: <input type="number" min="1" max="15" value="${staff.maxDays}" onchange="updateStaffMaxDays(${group.id}, ${staff.id}, this.value)">
            最多假日天数: <input type="number" min="0" max="8" value="${staff.maxHolidays === null ? '' : staff.maxHolidays}" onchange="updateStaffMaxHolidays(${group.id}, ${staff.id}, this.value)" placeholder="不限制">
            <button onclick="preschedule(${group.id}, ${staff.id})">预班</button>
            <button onclick="deletePreschedule(${group.id}, ${staff.id})">删除预班</button>
            <button onclick="deleteStaff(${group.id}, ${staff.id})">删除</button>
            <span class="prescheduled-dates" id="prescheduled-${group.id}-${staff.id}"></span>
            <div id="calendar-container-${group.id}-${staff.id}" style="display: none;">
                <div id="calendar-${group.id}-${staff.id}"></div>
                <button onclick="confirmPreschedule(${group.id}, ${staff.id})">确认</button>
            </div>
        `;
        staffListDiv.appendChild(staffDiv);
        if (staff.prescheduledDates.length > 0) {
            const sortedDates = [...staff.prescheduledDates].sort((a, b) => a - b);
            document.getElementById(`prescheduled-${group.id}-${staff.id}`).textContent = 
                `预班日期: ${sortedDates.join(', ')}`;
        }
    });
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

function preschedule(groupId, staffId) {
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
        defaultDate: staff.prescheduledDates.map(day => `${year}-${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`),
        inline: true,
        onChange: function(selectedDates, dateStr, instance) {
            staff.tempPrescheduledDates = selectedDates.map(date => date.getDate());
        }
    });
}

function confirmPreschedule(groupId, staffId) {
    const group = groupList.find(g => g.id === groupId);
    const staff = group.staffList.find(s => s.id === staffId);
    if (staff.tempPrescheduledDates) {
        staff.prescheduledDates = [...staff.tempPrescheduledDates].sort((a, b) => a - b);
        delete staff.tempPrescheduledDates;
    }
    document.getElementById(`prescheduled-${groupId}-${staffId}`).textContent = 
        `预班日期: ${staff.prescheduledDates.join(', ')}`;
    document.getElementById(`calendar-container-${groupId}-${staffId}`).style.display = 'none';
    if (currentFlatpickr) {
        currentFlatpickr.destroy();
        currentFlatpickr = null;
    }
    saveToLocalStorage();
}

function deletePreschedule(groupId, staffId) {
    const group = groupList.find(g => g.id === groupId);
    const staff = group.staffList.find(s => s.id === staffId);
    if (confirm(`確定要刪除 ${staff.name} 的所有預班資料嗎？`)) {
        staff.prescheduledDates = [];
        updateStaffList(group);
        saveToLocalStorage();
    }
}