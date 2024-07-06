let staffList = [];
let currentFlatpickr = null;

function addStaff() {
    const name = prompt("请输入人员姓名：");
    if (name) {
        const staff = {
            name: name,
            minDays: 1,
            maxDays: 15,
            maxHolidays: null,  // 将默认值设为 null
            prescheduledDates: []
        };
        staffList.push(staff);
        updateStaffList();
        saveToLocalStorage();
    }
}

function updateStaffList() {
    const staffListDiv = document.getElementById("staffList");
    staffListDiv.innerHTML = "";
    staffList.forEach((staff, index) => {
        const staffDiv = document.createElement("div");
        staffDiv.innerHTML = `
            ${staff.name} 
            最小天数: <input type="number" min="1" max="15" value="${staff.minDays}" onchange="updateStaffMinDays(${index}, this.value)">
            最大天数: <input type="number" min="1" max="15" value="${staff.maxDays}" onchange="updateStaffMaxDays(${index}, this.value)">
            最多假日天数: <input type="number" min="0" max="8" value="${staff.maxHolidays === null ? '' : staff.maxHolidays}" onchange="updateStaffMaxHolidays(${index}, this.value)" placeholder="不限制">
            <button onclick="preschedule(${index})">预班</button>
            <button onclick="deletePreschedule(${index})">删除预班</button>
            <button onclick="deleteStaff(${index})">删除</button>
            <span class="prescheduled-dates" id="prescheduled-${index}"></span>
            <div id="calendar-container-${index}" style="display: none;">
                <div id="calendar-${index}"></div>
                <button onclick="confirmPreschedule(${index})">确认</button>
            </div>
        `;
        staffListDiv.appendChild(staffDiv);
        if (staff.prescheduledDates.length > 0) {
            const sortedDates = [...staff.prescheduledDates].sort((a, b) => a - b);
            document.getElementById(`prescheduled-${index}`).textContent = 
                `预班日期: ${sortedDates.join(', ')}`;
        }
    });
}
function deleteStaff(index) {
    if (confirm(`确定要删除 ${staffList[index].name} 吗？`)) {
        staffList.splice(index, 1);
        updateStaffList();
        saveToLocalStorage();
    }
}

function updateStaffMinDays(index, value) {
    staffList[index].minDays = parseInt(value);
    saveToLocalStorage();
}

function updateStaffMaxDays(index, value) {
    staffList[index].maxDays = parseInt(value);
    saveToLocalStorage();
}

function updateStaffMaxHolidays(index, value) {
    staffList[index].maxHolidays = value === '' ? null : parseInt(value);
    saveToLocalStorage();
}

function preschedule(index) {
    const year = document.getElementById("year").value;
    const month = document.getElementById("month").value;
    const calendarContainer = document.getElementById(`calendar-container-${index}`);
    calendarContainer.style.display = 'block';
    
    if (currentFlatpickr) {
        currentFlatpickr.destroy();
    }
    
    currentFlatpickr = flatpickr(`#calendar-${index}`, {
        mode: "multiple",
        dateFormat: "Y-m-d",
        minDate: `${year}-${month.padStart(2, '0')}-01`,
        maxDate: new Date(year, month, 0),
        defaultDate: staffList[index].prescheduledDates.map(day => `${year}-${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`),
        inline: true,
        onChange: function(selectedDates, dateStr, instance) {
            staffList[index].tempPrescheduledDates = selectedDates.map(date => date.getDate());
        }
    });
}

function confirmPreschedule(index) {
    if (staffList[index].tempPrescheduledDates) {
        staffList[index].prescheduledDates = [...staffList[index].tempPrescheduledDates].sort((a, b) => a - b);
        delete staffList[index].tempPrescheduledDates;
    }
    document.getElementById(`prescheduled-${index}`).textContent = 
        `预班日期: ${staffList[index].prescheduledDates.join(', ')}`;
    document.getElementById(`calendar-container-${index}`).style.display = 'none';
    if (currentFlatpickr) {
        currentFlatpickr.destroy();
        currentFlatpickr = null;
    }
    saveToLocalStorage();
}

function generateSchedule() {
    const year = parseInt(document.getElementById("year").value);
    const month = parseInt(document.getElementById("month").value);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    let schedule = new Array(daysInMonth).fill(null);
    let staffWorkDays = staffList.map(() => ({ total: 0, weekdays: 0, holidays: 0 }));
    let previousAssignments = new Array(daysInMonth).fill(null);
    
    // 遍历每一天
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const isHoliday = date.getDay() === 0 || date.getDay() === 6;
        const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
        
        // 找出今天预班的人员
        let prescheduledStaff = staffList.filter(staff => staff.prescheduledDates.includes(day));
        
        // 如果有人预班，从非预班人员中选择
        if (prescheduledStaff.length > 0) {
            let availableStaff = staffList.filter(staff => 
                !staff.prescheduledDates.includes(day) &&
                staffWorkDays[staffList.indexOf(staff)].total < staff.maxDays &&
                (staff.maxHolidays === null || !isHoliday || staffWorkDays[staffList.indexOf(staff)].holidays < staff.maxHolidays) &&
                !isConsecutiveDay(previousAssignments, day - 1, staff.name)
            );
            
            if (availableStaff.length > 0) {
                let selectedStaff = availableStaff[Math.floor(Math.random() * availableStaff.length)];
                let selectedStaffIndex = staffList.indexOf(selectedStaff);
                schedule[day - 1] = selectedStaff.name;
                previousAssignments[day - 1] = selectedStaff.name;
                staffWorkDays[selectedStaffIndex].total++;
                if (isHoliday) {
                    staffWorkDays[selectedStaffIndex].holidays++;
                } else {
                    staffWorkDays[selectedStaffIndex].weekdays++;
                }
            }
        } else {
            // 如果没有人预班，从所有人中选择
            let availableStaff = staffList.filter(staff => 
                staffWorkDays[staffList.indexOf(staff)].total < staff.maxDays &&
                (staff.maxHolidays === null || !isHoliday || staffWorkDays[staffList.indexOf(staff)].holidays < staff.maxHolidays) &&
                !isConsecutiveDay(previousAssignments, day - 1, staff.name)
            );
            
            if (availableStaff.length > 0) {
                // 优先选择工作天数未达到最小天数的人员
                let priorityStaff = availableStaff.filter(staff => 
                    staffWorkDays[staffList.indexOf(staff)].total < staff.minDays
                );
                
                let selectedStaff;
                if (priorityStaff.length > 0) {
                    selectedStaff = priorityStaff[Math.floor(Math.random() * priorityStaff.length)];
                } else {
                    selectedStaff = availableStaff[Math.floor(Math.random() * availableStaff.length)];
                }
                
                let selectedStaffIndex = staffList.indexOf(selectedStaff);
                schedule[day - 1] = selectedStaff.name;
                previousAssignments[day - 1] = selectedStaff.name;
                staffWorkDays[selectedStaffIndex].total++;
                if (isHoliday) {
                    staffWorkDays[selectedStaffIndex].holidays++;
                } else {
                    staffWorkDays[selectedStaffIndex].weekdays++;
                }
            }
        }
    }
    
    // 检查最小值班天数
    let unfulfilled = staffList.filter((staff, index) => staffWorkDays[index].total < staff.minDays);
    
    // 显示结果
    const resultDiv = document.getElementById("scheduleResult");
    resultDiv.innerHTML = `
        <h3>${year}年${month}月排班表</h3>
        <table>
            <tr><th>日期 (星期)</th><th>值班人员</th></tr>
            ${schedule.map((staff, index) => {
                const date = new Date(year, month - 1, index + 1);
                const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
                return `<tr><td>${index + 1} (${dayOfWeek})</td><td>${staff || '未排班'}</td></tr>`;
            }).join('')}
        </table>
        ${unfulfilled.length > 0 ? `<p>警告：以下人员未达到最小值班天数：${unfulfilled.map(staff => staff.name).join(', ')}</p>` : ''}
    `;

    // 显示统计结果
    const statisticsDiv = document.getElementById("statisticsResult");
    statisticsDiv.innerHTML = `
        <table>
            <tr><th>人员</th><th>总值班日数</th><th>平日班数</th><th>假日班数</th></tr>
            ${staffList.map((staff, index) => `
                <tr>
                    <td>${staff.name}</td>
                    <td>${staffWorkDays[index].total}</td>
                    <td>${staffWorkDays[index].weekdays}</td>
                    <td>${staffWorkDays[index].holidays}</td>
                </tr>
            `).join('')}
        </table>
    `;
}

function isConsecutiveDay(previousAssignments, currentDay, staffName) {
    if (currentDay === 0) return false;
    return previousAssignments[currentDay - 1] === staffName;
}

function saveToLocalStorage() {
    localStorage.setItem('staffList', JSON.stringify(staffList));
}

function loadFromLocalStorage() {
    const savedStaffList = localStorage.getItem('staffList');
    if (savedStaffList) {
        staffList = JSON.parse(savedStaffList);
        updateStaffList();
    }
}

function saveStaffData() {
    const dataStr = JSON.stringify(staffList);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'staff_data.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function loadStaffData() {
    document.getElementById('fileInput').click();
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                staffList = JSON.parse(e.target.result);
                updateStaffList();
                saveToLocalStorage();
                alert('人员资料已成功载入');
            } catch (error) {
                alert('载入失败，请确保文件格式正确');
            }
        };
        reader.readAsText(file);
    }
}

function deleteAllStaff() {
    if (confirm('确定要删除所有人员资料吗？此操作无法撤销。')) {
        staffList = [];
        updateStaffList();
        saveToLocalStorage();
        alert('所有人员资料已删除');
    }
}

function deletePreschedule(index) {
    if (confirm(`确定要删除 ${staffList[index].name} 的所有预班资料吗？`)) {
        staffList[index].prescheduledDates = [];
        updateStaffList();
        saveToLocalStorage();
        alert('预班资料已删除');
    }
}

function deleteAllPreschedules() {
    if (confirm('确定要删除所有人员的预班资料吗？此操作无法撤销。')) {
        staffList.forEach(staff => {
            staff.prescheduledDates = [];
        });
        updateStaffList();
        saveToLocalStorage();
        alert('所有预班资料已删除');
    }
}

function clearAllPreschedules() {
    staffList.forEach(staff => {
        staff.prescheduledDates = [];
    });
    updateStaffList();
    saveToLocalStorage();
}

// 页面加载时从 localStorage 读取数据
window.onload = loadFromLocalStorage;