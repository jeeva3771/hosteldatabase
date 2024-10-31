<%- include('../../partials/header.ejs', { isMenuVisible : true, title: 'Attendance Report' }) %>
    <h2 class="text-center mb-5">Attendance Report</h2>
    <div class="container d-flex flex-column align-items-center">

        <div class="row g-3 justify-content-center mb-4">

            <div class="col-auto">
                <label class="visually-hidden" for="student">Student</label>
                <select class="form-select" id="student">
                    <option selected>Select Student</option>
                </select>
            </div>
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
            <div class="d-flex justify-content-center">
                <input type="submit" class="btn btn-primary" onclick="renderReport()">
            </div>
        </div>
            <table class="table table-bordered">
                <thead>
                    <tr id="dayHeaders">
                       
                    </tr>
                </thead>
                <tbody id="dateLabel">

                </tbody>
            </table>
        <div class="modal fade" id="errorModal" tabindex="-1" aria-labelledby="errorModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="errorModalLabel">Not found</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="errorModalBody">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal"
                            id="redirectButton">OK</button>
                    </div>
                </div>
            </div>
        </div>
        <%- include('../../partials/footer.ejs') %>
            <script>
                var selectedStudent = document.getElementById('student');
                var selectedMonth = document.getElementById('month');
                var selectedYear = document.getElementById('year');
                var dateLabel = document.getElementById('dateLabel');
                const currentTime = new Date();
                const currentYear = currentTime.getFullYear();
                const yearRange = 20;


                function populateDropDownStudents() {
                    var myHeaders = new Headers();

                    var requestOptions = {
                        method: 'GET',
                        headers: myHeaders,
                        redirect: 'follow'
                    };

                    fetch("http://localhost:1000/api/student/getstudent", requestOptions)
                        .then(response => response.json())
                        .then(response =>
                            response.forEach((student) => {
                                const option = document.createElement('option')
                                option.value = student.name
                                option.textContent = `${student.name} RegNo: ${student.registerNumber}`
                                selectedStudent.appendChild(option)
                            })
                        )
                        .catch(error => console.log('error', error));
                }

                function populateDropDownMonthAndYear() {
                    for (let i = 0; i < 12; i++) {
                        var monthOption = document.createElement('option')
                        monthOption.value = i
                        monthOption.textContent = new Date(0, i).toLocaleString('default', { month: 'long' });
                        selectedMonth.appendChild(monthOption)
                    }

                    for (let i = currentYear - yearRange; i <= currentYear + yearRange; i++) {
                        var yearOption = document.createElement('option')
                        yearOption.value = i
                        yearOption.textContent = i
                        selectedYear.appendChild(yearOption)
                    }
                }

                // function renderDayHeaders() {
                //     const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                //     const dayHeaders = document.getElementById('dayHeaders');
                //     dayHeaders.innerHTML = '';
                //     daysOfWeek.forEach(day => {
                //         const th = document.createElement('th');
                //         th.textContent = day;
                //         dayHeaders.appendChild(th);
                //     });
                // }

                function renderReport() {
                    dateLabel.innerHTML = '';
                    const month = parseInt(selectedMonth.value);
                    const year = parseInt(selectedYear.value);
                    const firstDay = new Date(year, month, 1).getDay();
                    const lastDate = new Date(year, month + 1, 0).getDate();
                    let date = 1;

                    fetch(`http://localhost:1000/api/attendance/studentattendancereport?month=${month + 1}&year=${year}&studentName=${selectedStudent.value}`)
                        .then(async (response) => {
                            if (!response.ok) {
                                if (response.status === 404) {
                                    const errorMessage = await response.text();
                                    errorModalBody.innerText = errorMessage;

                                    const modalInstance = new bootstrap.Modal(errorModal);
                                    modalInstance.show()
                                } else {
                                    alert(await "An error occurred while fetching attendance data.");
                                }
                            }
                            return response.json();
                        })
                        .then(data => {

                            const attendanceData = Object.entries(data).map(([key, value]) => {
                                return { date: key, status: value }
                            });
                            // renderDayHeaders()

                            for (let i = 0; i < 6; i++) {
                                const row = document.createElement('tr');

                                for (let j = 0; j < 7; j++) {
                                    const cell = document.createElement('td');

                                    if (i === 0 && j < firstDay) {
                                        cell.textContent = '';
                                    } else if (date > lastDate) {
                                        cell.textContent = '';
                                    } else {
                                        cell.textContent = date;

                                        const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

                                        const attendanceRecord = attendanceData.find(record =>
                                            record.date === formattedDate);

                                        if (attendanceRecord) {
                                            cell.style.backgroundColor = attendanceRecord.status === 1 ? 'green' : 'red';
                                            cell.textContent += attendanceRecord.status === 1 ? " - Present" : " - Absent";
                                        }
                                        date++;
                                    }

                                    row.appendChild(cell);
                                }
                                dateLabel.appendChild(row);

                                if (date > lastDate) break;
                            }
                        })
                        .catch(error => console.log('Error fetching attendance data:', error));
                }

                window.addEventListener('load', async () => {
                    try {
                        await Promise.all([
                            populateDropDownStudents(),
                            populateDropDownMonthAndYear()
                        ]);
                    } catch (error) {
                        console.error('Error populating dropdowns:', error);
                    }
                })
            </script>