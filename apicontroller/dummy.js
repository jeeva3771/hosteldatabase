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
    </div>
    <div class="form-group">
        <label for="studentList">Students :</label>
        <ul id="studentList" class="list-group"></ul>
    </div>
    <div class="text-center">
        <input type="hidden" id="attendanceId" value="<%=attendanceId %>" />
        <button type="button" onclick="saveOrUpdateAttendance()" class="btn btn-success" id="submitButton"
            disabled>Submit</button>
    </div>

    <%- include('../../partials/footer.ejs') %>
        <script>
            var blockCode = document.getElementById('blockCode');
            var floorNumber = document.getElementById('floorNumber');
            var roomNumber = document.getElementById('roomNumber');
            var checkIn = document.getElementById('checkIn');
            var studentList = document.getElementById('studentList');
            var submitButton = document.getElementById('submitButton');
            var attendanceId = document.getElementById('attendanceId').value;
            const today = new Date().toISOString().split('T')[0];
            checkIn.value = today;

            function getSelectedStatus(studentId) {
                const presentRadio = document.getElementById('present_' + studentId);
                const absentRadio = document.getElementById('absent_' + studentId);

                return presentRadio.checked ? 1 : absentRadio.checked ? 0 : null;
            }

            async function populateStudentList() {
                try {
                    const response = await fetch('http://localhost:1000/api/student?blockId=' + blockCode.value + '&floorNumber=' + floorNumber.value + '&roomId=' + roomNumber.value);
                    const students = await response.json();

                    studentList.innerHTML = '';
                    students.forEach(student => {
                        const li = document.createElement('li');
                        li.innerHTML = `
                <span>${student.name}</span>
                <div class="form-check float-right">
                    <input class="form-check-input" type="radio" name="isPresent_${student.studentId}" value="1" id="present_${student.studentId}">
                    <label class="form-check-label" for="present_${student.studentId}">Present</label>
                    <input class="form-check-input" type="radio" name="isPresent_${student.studentId}" value="0" id="absent_${student.studentId}">
                    <label class="form-check-label" for="absent_${student.studentId}">Absent</label>
                </div>`;
                        studentList.appendChild(li);
                    });
                } catch (error) {
                    console.log('Error fetching student list:', error);
                }
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
                    if (attendanceId) {
                        url += `/${attendanceId}`;
                    }

                    fetch(url, requestOptions)
                        .then(response => response.text())
                        .then((attendanceData) => window.location = '/attendance')
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
                if (attendanceId) {
                    await getAttendanceById(attendanceId);
                }

                async function populateBlockCode() {
                    try {
                        const response = await fetch('http://localhost:1000/api/block');
                        const responseData = await response.json();
                        const { blocks } = responseData;

                        let optionsList = '<option selected>Select a Block</option>';
                        blocks.forEach(block => {
                            optionsList += `<option value="${block.blockId}">${block.blockCode}</option>`;
                        });
                        blockCode.innerHTML = optionsList;
                    } catch (error) {
                        console.log('Error fetching block codes:', error);
                    }
                }

                async function populateFloorNumber() {
                    try {
                        const blockId = blockCode.value;
                        if (blockId === 'Select') {
                            floorNumber.innerHTML = '<option selected></option>';
                            return;
                        }

                        const response = await fetch(`http://localhost:1000/api/blockfloor/block/${blockId}`);
                        const blockFloors = await response.json();

                        if (blockFloors.length === 0) {
                            floorNumber.innerHTML = '<option selected>No floors available</option>';
                            return;
                        }

                        let optionsList = '<option selected>Select a Floor</option>';
                        blockFloors.forEach(blockFloor => {
                            optionsList += `<option value="${blockFloor.blockFloorId}">${blockFloor.floorNumber}</option>`;
                        });
                        floorNumber.innerHTML = optionsList;
                    } catch (error) {
                        console.log('Error fetching floor numbers:', error);
                    }
                }

                async function populateRoomNumber() {
                    try {
                        const blockFloorId = floorNumber.value;
                        if (blockFloorId === 'Select') {
                            roomNumber.innerHTML = '<option selected>Select a Room</option>';
                            return;
                        }

                        const response = await fetch(`http://localhost:1000/api/room/blockfloor/${blockFloorId}`);
                        const rooms = await response.json();

                        if (rooms.length === 0) {
                            roomNumber.innerHTML = '<option selected>No rooms available</option>';
                            return;
                        }

                        let optionsList = '<option selected>Select a Room</option>';
                        rooms.forEach(room => {
                            optionsList += `<option value="${room.roomId}">${room.roomNumber}</option>`;
                        });
                        roomNumber.innerHTML = optionsList;

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

                        const response = await fetch(`http://localhost:1000/api/student/room/${roomId}`);
                        const students = await response.json();

                        if (students.length === 0) {
                            studentList.innerHTML = '<li class="list-group-item">No students available</li>';
                            return;
                        }

                        studentList.innerHTML = '';
                        students.forEach(student => {
                            const li = document.createElement('li');
                            li.classList.add('list-group-item');
                            li.innerHTML = `
                                <span>${student.name}</span>
                                <div class="form-check form-check-inline float-right">
                                    <input class="form-check-input" type="radio" name="isPresent_${student.studentId}" value="0" id="absent_${student.studentId}">
                                    <label class="form-check-label" for="absent_${student.studentId}">Absent</label>
                                </div>
                                <div class="form-check form-check-inline float-right">
                                    <input class="form-check-input" type="radio" name="isPresent_${student.studentId}" value="1" id="present_${student.studentId}">
                                    <label class="form-check-label" for="present_${student.studentId}">Present</label>
                                </div>`
                            studentList.appendChild(li);
                        });

                    } catch (error) {
                        console.log('Error fetching student list:', error);
                    }
                }
                blockCode.addEventListener('change', populateFloorNumber);
                floorNumber.addEventListener('change', populateRoomNumber);
                roomNumber.addEventListener('change', populateStudentList);
                studentList.addEventListener('change', toggleSubmitButton);

                async function getAttendanceById(attendanceId) {
                    try {
                        const response = await fetch("http://localhost:1000/api/attendance?attendanceId=");
                        const attendance = await response.json();
                        // studentName.value = attendance.studentId;
                        roomNumber.value = roomId;
                        floorNumber.value = blockFloorId;
                        blockCode.value = blockId;
                        checkIn.value = checkIn;
                        attendance.students.forEach(student => {
                            if (student.isPresent === 1) {
                                document.getElementById('present_' + student.studentId).checked = true;
                            } else if (student.isPresent === 0) {
                                document.getElementById('absent_' + student.studentId).checked = true;
                            }
                        });
                    } catch (error) {
                        console.error('Error fetching Attendance details:', error);
                    }
                }
            }

            initializeForm();
        </script>

        const urlParams = new URLSearchParams(window.location.search);
const myParam = urlParams.get('blockId');