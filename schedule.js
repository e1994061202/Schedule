let globalGroupSchedules = {};

function generateSchedule() {
    const year = parseInt(document.getElementById("year").value);
    const month = parseInt(document.getElementById("month").value);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    globalGroupSchedules = {};
    let groupStaffWorkDays = {};    
    groupList.forEach(group => {
        globalGroupSchedules[group.id] = new Array(daysInMonth).fill(null);
        groupStaffWorkDays[group.id] = {};
        group.staffList.forEach(staff => {
            groupStaffWorkDays[group.id][staff.id] = { total: 0, weekdays: 0, holidays: 0 };
        });
    });
    
    groupList.forEach(group => {
        let previousAssignments = new Array(daysInMonth).fill(null);
        
        // 遍歷每一天
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const isHoliday = date.getDay() === 0 || date.getDay() === 6;
            
            // 找出今天預班的人員
            let prescheduledStaff = group.staffList.filter(staff => 
                staff.prescheduledDates && staff.prescheduledDates.includes(day) &&
                (!staff.noDutyDates || !staff.noDutyDates.includes(day))
            );
            
            if (prescheduledStaff.length > 0) {
                // 如果有預班人員，優先從預班人員中選擇
                let availablePrescheduled = getAvailableStaff(prescheduledStaff, groupStaffWorkDays[group.id], isHoliday, previousAssignments, day - 1, group.isDoubleKing);
                if (availablePrescheduled.length > 0) {
                    assignStaff(availablePrescheduled, globalGroupSchedules[group.id], groupStaffWorkDays[group.id], previousAssignments, day, isHoliday);
                    continue;  // 如果已經安排了預班人員，就進入下一天
                }
            }
            
            // 如果沒有可用的預班人員，從所有可用人員中選擇
            let availableStaff = group.staffList.filter(staff => 
                (!staff.noDutyDates || !staff.noDutyDates.includes(day))
            );
            
            if (availableStaff.length > 0) {
                let staffToAssign = getAvailableStaff(availableStaff, groupStaffWorkDays[group.id], isHoliday, previousAssignments, day - 1, group.isDoubleKing);
                
                if (staffToAssign.length > 0) {
                    // 優先選擇工作天數未達到最小天數的人員
                    let priorityStaff = staffToAssign.filter(staff => 
                        groupStaffWorkDays[group.id][staff.id].total < staff.minDays
                    );
                    
                    if (priorityStaff.length > 0) {
                        assignStaff(priorityStaff, globalGroupSchedules[group.id], groupStaffWorkDays[group.id], previousAssignments, day, isHoliday);
                    } else {
                        assignStaff(staffToAssign, globalGroupSchedules[group.id], groupStaffWorkDays[group.id], previousAssignments, day, isHoliday);
                    }
                }
            }
        }
    });
    

    // 檢查最小值班天數
    let unfulfilled = [];
    groupList.forEach(group => {
        group.staffList.forEach(staff => {
            if (groupStaffWorkDays[group.id][staff.id].total < staff.minDays) {
                unfulfilled.push(`${group.name} - ${staff.name}`);
            }
        });
    });
    
    // 顯示結果
    displayScheduleResult(year, month, globalGroupSchedules, unfulfilled);
    displayStatistics(groupStaffWorkDays);
}

function getAvailableStaff(staffList, staffWorkDays, isHoliday, previousAssignments, currentDay, isDoubleKing) {
    return staffList.filter(staff => {
        const workDays = staffWorkDays[staff.id];
        const lastWorkDay = findLastWorkDay(previousAssignments, currentDay, staff.name);
        return workDays.total < staff.maxDays &&
            (staff.maxHolidays === null || !isHoliday || workDays.holidays < staff.maxHolidays) &&
            (isDoubleKing || !isConsecutiveDay(previousAssignments, currentDay, staff.name)) &&
            (lastWorkDay === -1 || currentDay - lastWorkDay > 2);  // 確保至少有兩天的休息
    });
}
function findLastWorkDay(previousAssignments, currentDay, staffName) {
    for (let i = currentDay - 1; i >= 0; i--) {
        if (previousAssignments[i] === staffName) {
            return i;
        }
    }
    return -1;
}
function assignStaff(availableStaff, schedule, staffWorkDays, previousAssignments, day, isHoliday) {
    // 計算權重
    const weights = availableStaff.map(staff => 1 / (staffWorkDays[staff.id].total + 1));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    // 根據權重隨機選擇
    let random = Math.random() * totalWeight;
    let selectedStaff;
    for (let i = 0; i < availableStaff.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            selectedStaff = availableStaff[i];
            break;
        }
    }

    // 更新排班和統計資訊
    schedule[day - 1] = selectedStaff.name;
    previousAssignments[day - 1] = selectedStaff.name;
    let workDays = staffWorkDays[selectedStaff.id];
    workDays.total++;
    if (isHoliday) {
        workDays.holidays++;
    } else {
        workDays.weekdays++;
    }
}

function isConsecutiveDay(previousAssignments, currentDay, staffName) {
    if (currentDay === 0) return false;
    return previousAssignments[currentDay - 1] === staffName;
}