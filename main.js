// 全局變量
let currentFlatpickr = null;
let groupList = [];

// 頁面加載時初始化
window.onload = function() {
    loadFromLocalStorage();
    updateGroupList();
    document.getElementById("month").addEventListener("change", clearAllSchedulesOnMonthChange);
};

function clearAllSchedulesOnMonthChange() {
    if (confirm("變更月份將會刪除所有預班和不值班日期。確定要繼續嗎？")) {
        clearAllSchedules();
    } else {
        // 如果用戶取消，將月份選擇恢復到之前的值
        const savedMonth = localStorage.getItem('selectedMonth');
        if (savedMonth) {
            document.getElementById("month").value = savedMonth;
        }
    }
}

function clearAllSchedules() {
    groupList.forEach(group => {
        group.staffList.forEach(staff => {
            staff.prescheduledDates = [];
            staff.noDutyDates = [];
        });
    });
    updateGroupList();
    saveToLocalStorage();
    alert("所有預班和不值班日期已被清除。");
    
    // 保存當前選擇的月份
    const currentMonth = document.getElementById("month").value;
    localStorage.setItem('selectedMonth', currentMonth);
}

// 顯示規則模態窗口
function showRules() {
    document.getElementById("ruleModal").style.display = "block";
}

// 隱藏規則模態窗口
function hideRules() {
    document.getElementById("ruleModal").style.display = "none";
}