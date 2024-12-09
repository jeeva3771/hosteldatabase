<%- include('../../partials/header.ejs', { appURL: appURL, title: 'Attendance Report' }) %>

<section class="section">
    <div class="row">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-body">
            <div class="container d-flex flex-column align-items-center">
                <div class="row g-3 justify-content-center mb-4 mt-3">
                    <div class="col-auto">
                        <label class="visually-hidden" for="student">Student</label>
                        <input type="text" class="form-control" id="student" disabled>
                    </div>
                </div>
                <div class="row g-3 justify-content-center mb-5">
                    <div class="col-auto">
                        <label class="visually-hidden" for="month">Month</label>
                        <select class="form-select" id="month">
                            <option selected>Select Month</option>
                        </select>
                    </div>
                    <div class="col-auto">
                        <label class="visually-hidden" for="year">Year</label>
                        <select class="form-select" id="year">
                            <option selected>Select Year</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="row justify-content-center">
                <table class="table table-bordered w-25 mb-4 border border-dark-subtle">
                    <thead>
                        <tr id="dayHeaders"></tr>
                    </thead>
                    <tbody id="dateLabel"></tbody>
                </table>
                <div class="d-flex flex-row mb-3 align-items-center justify-content-center d-none" id="attendanceStatus">
                    <div class="p-2 smallBox mt-0 clr1"></div>
                    <span class="ms-2">Present</span>

                    <div class="p-2 smallBox mt-0 clr2 ms-3"></div>
                    <span class="ms-2">Absent</span>

                    <div class="p-2 smallBox mt-0 ms-3 rounded-0 border border-1"></div>
                    <span class="ms-2">Not Marked</span>
                </div>
            </div>
            <div class="attendanceSummary"></div>
        </div>
    </div>
</div>
</div>
</section>
</main>
<script>
    const studentDom = document.getElementById('student');
    const selectedMonthDom = document.getElementById('month');
    const selectedYearDom = document.getElementById('year');
    const dateLabelDom = document.getElementById('dateLabel');
    const dayHeadersDom = document.getElementById('dayHeaders');
    const currentTime = new Date();
    const currentYear = currentTime.getFullYear();
    const yearRange = 20;
    const studentName = "<%=studentName%>";
    const studentRegNo = "<%=studentRegNo%>";
    studentDom.value = studentName;

    window.addEventListener('load', async () => {
        try {
            await populateDropDownMonthAndYear();
            await renderReport();
        } catch (error) {
            alert('Something went wrong.Please try later1.')
        }
    });

    selectedMonthDom.addEventListener('change', renderReport);
    selectedYearDom.addEventListener('change', renderReport);

    function populateDropDownMonthAndYear() {
        for (let i = 0; i < 12; i++) {
            const monthOption = document.createElement('option');
            monthOption.value = i;
            monthOption.textContent = new Date(0, i).toLocaleString('default', { month: 'long' });
            selectedMonthDom.appendChild(monthOption);
        }

        for (let i = currentYear - yearRange; i <= currentYear + yearRange; i++) {
            const yearOption = document.createElement('option');
            yearOption.value = i;
            yearOption.textContent = i;
            selectedYearDom.appendChild(yearOption);
        }
        selectedMonthDom.value = currentTime.getMonth();
        selectedYearDom.value = currentYear;
    }

    function renderDayHeaders() {
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeadersDom.innerHTML = '';
        daysOfWeek.forEach(day => {
            const th = document.createElement('th');
            th.textContent = day;
            dayHeadersDom.appendChild(th);
        });
    }

    async function renderReport() {
        const month = parseInt(selectedMonthDom.value);
        const year = parseInt(selectedYearDom.value);
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();

        dayHeadersDom.innerHTML = '';
        dateLabelDom.innerHTML = '';

        try {
            var fetchUrl = getAppUrl('api/attendance/studentattendancereport') + 
                `?month=${month + 1}&year=${year}&studentName=${studentDom.value}`
            
            if (studentName) {
                fetchUrl += `&registerNumber=${studentRegNo}&studentuse=true`
            }

            const response = await fetch(fetchUrl);
            if (!response.ok) {
                if (response.status === 404) {
                    renderDefaultCalendar(firstDay, lastDate);
                    toggleAttendanceStatusDisplay(true);
                    displayAttendanceSummary(year, month, lastDate, 0, 0); // No data
                    return;
                } else {
                    throw new Error(`Failed to fetch attendance data: ${response.status}`);
                }
            }
            renderDayHeaders();
            const data = await response.json();
            const attendanceData = Object.entries(data).map(([key, value]) => ({ date: key, status: value }));

            if (attendanceData.length === 0) {
                renderDefaultCalendar(firstDay, lastDate);
                toggleAttendanceStatusDisplay(false); 
                displayAttendanceSummary(year, month, lastDate, 0, 0); // No data

            } else {
                toggleAttendanceStatusDisplay(true);
                let presentCount = 0;
                let absentCount = 0;
                let date = 1;

                for (let i = 0; i < 6; i++) {
                    const row = document.createElement('tr');

                    for (let j = 0; j < 7; j++) {
                        const cell = document.createElement('td');
                        cell.classList.add('text-center');

                        if (i === 0 && j < firstDay || date > lastDate) {
                            cell.textContent = '';
                        } else {
                            cell.textContent = date;
                            const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                            const attendanceRecord = attendanceData.find(record => record.date === formattedDate);

                            if (attendanceRecord) {
                                if (attendanceRecord.status === 1) {
                                    presentCount++;
                                    cell.style.backgroundColor = 'green';
                                } else {
                                    absentCount++;
                                    cell.style.backgroundColor = 'red';
                                }
                                cell.classList.add('text-white');
                            }
                            date++;
                        }
                        row.appendChild(cell);
                    }
                    dateLabelDom.appendChild(row);
                    if (date > lastDate) break;
                    displayAttendanceSummary(year, month, lastDate, presentCount, absentCount);
                }
            }
        } catch (error) {
            console.log(error)
            alert('Something went wrong.Please try later2.')
        }
    }

    function renderDefaultCalendar(firstDay, lastDate) {
        let date = 1;
        dayHeadersDom.innerHTML = '';
        dateLabelDom.innerHTML = '';
        renderDayHeaders();

        for (let i = 0; i < 6; i++) {
            const row = document.createElement('tr');
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('td');
                cell.classList.add('text-center');

                if (i === 0 && j < firstDay) {
                    cell.textContent = '';
                } else if (date > lastDate) {
                    cell.textContent = '';
                } else {
                    cell.textContent = date;
                    date++;
                }
                row.appendChild(cell);
            }
            dateLabelDom.appendChild(row);
            if (date > lastDate) break;
        }
    }

    function displayAttendanceSummary(year, month, totalDays, presentCount, absentCount) {
        const summaryContainer = document.getElementById('attendanceSummary');
        const monthName = new Date(0, month).toLocaleString('default', { month: 'long' });
        summaryContainer.textContent = `${year} - ${monthName} ${totalDays} days | present: ${presentCount} | absent: ${absentCount}`;
    }

    function toggleAttendanceStatusDisplay(show) {
        attendanceStatus.classList.toggle('d-none', !show);
    }

</script>

userImageDom.src
/////////////////////////////////





app.use((req, res, next) => {
    // Handle warden routes
    if (!pageWardenSessionExclude.includes(req.originalUrl) && req.originalUrl.startsWith('/warden')) {
        if (!req.session.isLogged) {
            return res.status(401).redirect(getAppUrl('login'));
        }
    }

    // Handle student routes
    if (!pageStudentSessionExclude.includes(req.originalUrl) && req.originalUrl.startsWith('/student')) {
        if (!req.session.isLoggedStudent) {
            return res.status(401).redirect(getAppUrl('student/login'));
        }
    }

    return next();
});