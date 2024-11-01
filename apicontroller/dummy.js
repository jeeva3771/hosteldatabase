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



.........................

<%- include('../../partials/header.ejs', { isMenuVisible : true, title: 'Attendance' }) %>
    <h2 class="text-center mb-4">Attendance Form</h2>
    <div class="row justify-content-center">
        <div class="col-md-3">
            <div class="form-group">
                <label for="blockCode">Block Code</label>
                <select class="form-control" id="blockCode"></select>
            </div>
            <div class="form-group">
                <label for="floorNumber">Floor Number</label>
                <select class="form-control" id="floorNumber"></select>
            </div>
            <div class="form-group">
                <label for="roomNumber">Room Number</label>
                <select class="form-control" id="roomNumber"></select>
            </div>
            <div class="form-group">
                <label for="checkIn">Check-in Date</label>
                <input type="date" class="form-control" id="checkIn">
            </div>
        </div>
        <div class="form-group">
            <label for="studentList">Students :</label>
            <ul id="studentList" class="list-group"></ul>
        </div>
        <div class="text-center">
            <button type="button" onclick="saveOrUpdateAttendance()" class="btn btn-success" id="submitButton"
                disabled>Submit</button>
        </div>
    </div>

    <%- include('../../partials/footer.ejs') %>
        <script>
            const urlParams = new URLSearchParams(window.location.search);
            var blockCode = document.getElementById('blockCode');
            var floorNumber = document.getElementById('floorNumber');
            var roomNumber = document.getElementById('roomNumber');
            var checkIn = document.getElementById('checkIn');
            var studentList = document.getElementById('studentList');
            var submitButton = document.getElementById('submitButton');
            const today = new Date().toISOString().split('T')[0];
            checkIn.value = today;

            function convertToISO(checkIn) {
                let [year, month, day] = checkIn.split('-');
                day = day.replace(/\D/g, '');
                day = day.padStart(2, '0');
                year = `20${year.padStart(2, '0')}`;
                const months = {
                    "Jan": "01",
                    "Feb": "02",
                    "Mar": "03",
                    "Apr": "04",
                    "May": "05",
                    "Jun": "06",
                    "Jul": "07",
                    "Aug": "08",
                    "Sep": "09",
                    "Oct": "10",
                    "Nov": "11",
                    "Dec": "12"
                };
                const monthNumber = months[month];
                return `${year}-${monthNumber}-${day}`;
            }

            const checkInParam = urlParams.get('checkIn');
            if (checkInParam) {
                const isoDate = convertToISO(checkInParam);
                checkIn.value = isoDate;
            }

            function getSelectedStatus(studentId) {
                const presentRadio = document.getElementById('present_' + studentId);
                const absentRadio = document.getElementById('absent_' + studentId);

                return presentRadio.checked ? 1 : absentRadio.checked ? 0 : null;
            }

            function saveOrUpdateAttendance() {
                const students = document.querySelectorAll('#studentList li');
                let studentAttendanceData = [];

                students.forEach((student) => {
                    const studentId = student.querySelector('input[type="radio"]').id.split('_')[1];
                    const isPresentValue = getSelectedStatus(studentId);

                    studentAttendanceData.push({
                        "studentId": studentId,
                        "isPresent": isPresentValue
                    });
                });

                var myHeaders = new Headers();
                myHeaders.append("Content-Type", "application/json");

                for (var i = 0; i < studentAttendanceData.length; i++) {
                    var raw = JSON.stringify({
                        "blockId": blockCode.value,
                        "blockFloorId": floorNumber.value,
                        "roomId": roomNumber.value,
                        "checkInDate": checkIn.value,
                        "studentId": studentAttendanceData[i].studentId,
                        "isPresent": studentAttendanceData[i].isPresent
                    });

                    var requestOptions = {
                        method: 'POST',
                        headers: myHeaders,
                        body: raw
                    };

                    let url = `http://localhost:1000/api/attendance/${blockCode.value}/${floorNumber.value}/${roomNumber.value}`;

                    fetch(url, requestOptions)
                        .then(() => window.location = '/attendance')
                        .catch(error => console.error('error', error));
                }
            }

            function toggleSubmitButton() {
                const students = document.querySelectorAll('#studentList li');
                let allStatusSelected = true;

                students.forEach((student) => {
                    const studentId = student.querySelector('input[type="radio"]').id.split('_')[1];
                    if (getSelectedStatus(studentId) === null) {
                        allStatusSelected = false;
                    }
                });

                submitButton.disabled = !(
                    blockCode.value !== 'Select' &&
                    floorNumber.value !== 'Select' &&
                    roomNumber.value !== 'Select' &&
                    checkIn.value !== '' &&
                    allStatusSelected
                );
            }

            async function initializeForm() {
                await populateBlockCode();
                await populateFloorNumber();
                await populateRoomNumber();
                await populateStudentList()

                blockCode.addEventListener('change', populateFloorNumber);
                floorNumber.addEventListener('change', populateRoomNumber);
                roomNumber.addEventListener('change', populateStudentList);
                studentList.addEventListener('change', toggleSubmitButton);

            }

            initializeForm();

            async function populateBlockCode() {
                try {
                    const myParam = urlParams.get('blockId');
                    const url = myParam ? `http://localhost:1000/api/block/blockFloor/blockCodeCount?blockId=${myParam}` :
                        'http://localhost:1000/api/block/blockFloor/blockCodeCount';
                    const response = await fetch(url);
                    const blocks = await response.json();

                    const activeOptions = [];
                    const disabledOptions = [];

                    blockCode.innerHTML = '<option selected>Select a Block</option>';

                    blocks.forEach(block => {
                        const option = document.createElement('option');
                        option.value = block.blockId;
                        option.textContent = `${block.blockCode} (Floors: ${block.floorCount})`;
                        if (block.floorCount === 0) {
                            option.disabled = true;
                            disabledOptions.push(option);
                        } else {
                            activeOptions.push(option);
                        }
                    });

                    activeOptions.forEach(option => {
                        blockCode.appendChild(option);
                    });

                    disabledOptions.forEach(option => {
                        blockCode.appendChild(option);
                    });

                    if (myParam) {
                        blockCode.value = myParam;
                        await populateFloorNumber();
                    }
                } catch (error) {
                    console.log('Error fetching block codes:', error);
                }
            }

            async function populateFloorNumber() {
                try {
                    const myParam = urlParams.get('blockFloorId');
                    const blockId = blockCode.value;

                    if (blockId === 'Select' || blockId === '') {
                        floorNumber.innerHTML = 'No rooms available';
                        return;
                    }
                    
                    const response = await fetch
                    (`http://localhost:1000/api/blockfloor/room/floorCount?blockId=${blockId}&blockFloor=true`);
                    const blockFloors = await response.json();

                    const activeOptions = [];
                    const disabledOptions = [];

                    floorNumber.innerHTML = '<option selected>Select a Floor</option>';

                    blockFloors.forEach(blockFloor => {
                        const option = document.createElement('option');
                        option.value = blockFloor.blockFloorId;
                        option.textContent = `${blockFloor.floorNumber} (Rooms: ${blockFloor.roomCount})`;
                        if (blockFloor.roomCount === 0) {
                            option.disabled = true;
                            disabledOptions.push(option);
                        } else {
                            activeOptions.push(option);
                        }
                    });

                    activeOptions.forEach(option => {
                        floorNumber.appendChild(option);
                    });

                    disabledOptions.forEach(option => {
                        floorNumber.appendChild(option);
                    });


                    if (myParam) {
                        floorNumber.value = myParam;
                        await populateRoomNumber
                    }

                } catch (error) {
                    console.log('Error fetching floor numbers:', error);
                }
            }

            async function populateRoomNumber() {
                try {
                    const myParam = urlParams.get('roomId');
                    const blockFloorId = floorNumber.value;

                    if (blockFloorId === 'Select' || blockFloorId === '') {
                        roomNumber.innerHTML = '';
                        return;
                    }

                    const response = await fetch
                    (`http://localhost:1000/api/room/student/count?blockFloorId=${blockFloorId}&student=true`);
                    const rooms = await response.json();

                    if (rooms.length === 0) {
                        roomNumber.innerHTML = '<option selected>No rooms available</option>';
                        return;
                    }

                    const activeOptions = [];
                    const disabledOptions = [];

                    roomNumber.innerHTML = '<option selected>Select a Room</option>';

                    rooms.forEach(room => {
                        const option = document.createElement('option');
                        option.value = room.roomId;
                        option.textContent = `${room.roomNumber} (Students: ${room.studentCount})`;
                        if (room.studentCount === 0) {
                            option.disabled = true;
                            disabledOptions.push(option);
                        } else {
                            activeOptions.push(option);
                        }
                    });

                    activeOptions.forEach(option => {
                        roomNumber.appendChild(option);
                    });

                    disabledOptions.forEach(option => {
                        roomNumber.appendChild(option);
                    });

                    if (myParam) {
                        roomNumber.value = myParam;
                        await populateStudentList
                    }

                } catch (error) {
                    console.log('Error fetching room numbers:', error);
                }
            }

            async function populateStudentList() {
                try {
                    const roomId = roomNumber.value;
                    if (roomId === 'Select') {
                        studentList.innerHTML = '';
                        return;
                    }

                    const response = await fetch(`http://localhost:1000/api/attendance/student/${roomId}?checkIn=${checkIn.value}`);
                    const students = await response.json();

                    if (students.length === 0) {
                        studentList.innerHTML = '<li class="list-group-item">No students available</li>';
                        return;
                    }

                    studentList.innerHTML = '';
                    students.forEach(student => {
                        const isPresentChecked = student.isPresent === 1 ? 'checked' : '';
                        const isAbsentChecked = student.isPresent === 0 ? 'checked' : '';

                        const li = document.createElement('li');
                        li.classList.add('list-group-item');
                        li.innerHTML = `
                <span>${student.name}</span>
                <div class="form-check form-check-inline float-right">
                    <input class="form-check-input" type="radio" name="isPresent_${student.studentId}" value="1" id="present_${student.studentId}" ${isPresentChecked}>
                    <label class="form-check-label" for="present_${student.studentId}">Present</label>
                </div>
                <div class="form-check form-check-inline float-right">
                    <input class="form-check-input" type="radio" name="isPresent_${student.studentId}" value="0" id="absent_${student.studentId}" ${isAbsentChecked}>
                    <label class="form-check-label" for="absent_${student.studentId}">Absent</label>
                </div>`;

                        studentList.appendChild(li);
                    });

                } catch (error) {
                    console.log('Error fetching student list:', error);
                }
            }
            
        </script>