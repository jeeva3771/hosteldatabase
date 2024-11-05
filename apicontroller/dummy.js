<%- include('../../partials/header.ejs', { isMenuVisible : true, title: 'Attendance' }) %>
    <div class="contentMain">
        <h2 class="mb-4">Attendance Form</h2>
        <div class="row justify-content-center">
            <div class="col-4 text-center">
                <div class="form-group">
                    <label for="date" class="mb-2"><strong>Date</strong></label>
                    <input type="date" class="form-control controlInputType" id="checkIn"
                        onchange="populateBlockCode()">
                </div>
            </div>
        </div>
        <div class="container text-center mt-2">
            <div class="row justify-content-center" id="blockCodeContainer">
                <p><strong>Block</strong></p>
                <div class="col-5">
                    <div class="row row-cols-4 g-3 justify-content-center" id="blockCode">
                    </div>
                </div>
            </div>
        </div>
        <div class="container text-center mt-2">
            <div class="row justify-content-center hidden" id="floorNumberContainer">
                <p><strong>Floor Number</strong></p>
                <div class="col-2 mx-auto">
                    <div class="row row-cols-4 g-3 justify-content-center" id="floorNumber">
                    </div>
                </div>
            </div>
        </div>
        <div class="container text-center mt-2">
            <div class="row justify-content-center hidden" id="roomNumberContainer">
                <p><strong>Room Number</strong></p>
                <div class="col-2 mx-auto">
                    <div class="row row-cols-4 g-3 justify-content-center" id="roomNumber">
                    </div>
                </div>
            </div>
        </div>
        <div class="d-flex flex-row mb-3 align-items-center justify-content-center hidden mt-4" id="status">
            <b class="me-2">Attendance Taken :</b>
            <div class="p-2 smallBox mt-0 clr1"></div>
            <span class="ms-2">100%</span>

            <div class="p-2 smallBox mt-0 clr3 ms-3"></div>
            <span class="ms-2">Below-99%</span>

            <div class="p-2 smallBox mt-0 ms-3 rounded-0 border border-1 clr2"></div>
            <span class="ms-2">0%</span>

            <div class="p-2 smallBox mt-0 ms-3 rounded-0 border border-1 clr4"></div>
            <span class="ms-2">No Field</span>
        </div>
        <div class="container text-center mt-2">
            <div id="studentContainer" class="hidden">
                <p><strong>Students</strong></p>

                <div id="studentList" class="border mb-4">
                </div>
                <button type="button" onclick="saveOrUpdateAttendance()" class="btn btn-success"
                    id="submitButton">Submit</button>
            </div>
        </div>
    </div>

    <%- include('../../partials/footer.ejs') %>
        <script>
            const urlParams = new URLSearchParams(window.location.search);
            var blockCodeContainer = document.getElementById('blockCodeContainer');
            var blockCode = document.getElementById('blockCode');
            var floorNumberContainer = document.getElementById('floorNumberContainer');
            var floorNumber = document.getElementById('floorNumber');
            var roomNumberContainer = document.getElementById('roomNumberContainer');
            var roomNumber = document.getElementById('roomNumber');
            var checkIn = document.getElementById('checkIn');
            var studentContainer = document.getElementById('studentContainer');
            var studentList = document.getElementById('studentList');
            var status = document.getElementById('status');
            var submitButton = document.getElementById('submitButton');
            const today = new Date().toISOString().split('T')[0];
            checkIn.value = today;
            let currentBlockId = null;
            let currentBlockFloorId = null;
            let currentRoomId = null;


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
                        .then(async (response) => {
                            if (response.status === 201 || 200) {
                                window.location = '/attendance';
                            } else {
                                alert(await response.text())
                            }
                        })
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
                    allStatusSelected
                );
            }

            async function populateBlockCode() {
                blockCode.innerHTML = '';
                var activeOptions = [];
                var disabledOptions = [];

                try {
                    if (!checkIn.value || checkIn.value > today) {
                        status.style.display = 'none';
                        return;
                    }

                    const myParam = urlParams.get('blockId');
                    const url = myParam ? `http://localhost:1000/api/attendance/block?blockId=${myParam}` :
                        `http://localhost:1000/api/attendance/block?date=${checkIn.value}`;

                    if (myParam) {
                        blockCode.value = myParam;
                        return populateFloorNumber(myParam);
                    }

                    var myHeaders = new Headers();

                    var requestOptions = {
                        method: 'GET',
                        headers: myHeaders,
                        redirect: 'follow'
                    };

                    const response = await fetch(url);
                    const blocks = await response.json();

                    blocks.forEach(async (block) => {
                        const blockDom = document.createElement('button');
                        blockDom.className = 'btn btn-secondary me-2';
                        blockDom.value = block.blockId;
                        blockDom.textContent = block.blockCode;
                        var blockBasedPercentage = (block.attendanceCount / block.studentsCount) * 100

                        if (block.studentsCount === 0) {
                            blockDom.classList.add('disabled')
                            disabledOptions.push(blockDom)
                        } else if (blockBasedPercentage === 100) {
                            blockDom.style.backgroundColor = 'green'
                            activeOptions.push(blockDom)
                        } else if (block.attendanceCount > 0 && blockBasedPercentage < 99) {
                            blockDom.style.backgroundColor = 'orange'
                            activeOptions.push(blockDom)
                        } else {
                            blockDom.style.backgroundColor = 'red'
                            activeOptions.push(blockDom)
                        }

                        blockDom.onclick = () => {
                            currentBlockId = block.blockId;
                            blockCode.value = block.blockId;
                            populateFloorNumber(block.blockId);
                            blockCodeContainer.style.display = 'none';
                            floorNumberContainer.style.display = 'block';
                        };
                    })

                    activeOptions.forEach(block => {
                        blockCode.appendChild(block);
                    })

                    disabledOptions.forEach(block => {
                        blockCode.appendChild(block);
                    })

                    if (activeOptions.length > 0 || disabledOptions.length > 0) {
                        status.style.display = 'block';
                    }


                } catch (error) {
                    console.log('Error fetching block codes:', error);
                }
            }

            async function populateFloorNumber(blockId) {
                floorNumber.innerHTML = ''
                var activeOptions = [];
                var disabledOptions = [];
                try {
                    if (!checkIn.value || checkIn.value > today) {
                        return;
                    }

                    const myParam = urlParams.get('blockFloorId');
                    const url = myParam ? `http://localhost:1000/api/attendance/blockfloor?date=${checkIn.value}&blockId=${myParam}` :
                        `http://localhost:1000/api/attendance/blockfloor?date=${checkIn.value}&blockId=${blockId}`;

                    if (myParam) {
                        floorNumber.value = myParam;
                        return populateRoomNumber(myParam)
                    }

                    var myHeaders = new Headers();
                    var requestOptions = {
                        method: 'GET',
                        headers: myHeaders,
                        redirect: 'follow'
                    };

                    const response = await fetch(url);
                    const blockFloors = await response.json();

                    blockFloors.forEach((blockFloor) => {
                        const blockFloorDom = document.createElement('button');
                        blockFloorDom.className = 'btn btn-secondary me-2';
                        blockFloorDom.value = blockFloor.blockFloorId;
                        blockFloorDom.textContent = blockFloor.floorNumber;
                        var blockFloorBasedPercentage = (blockFloor.attendanceCount / blockFloor.studentsCount) * 100

                        if (blockFloor.studentsCount === 0) {
                            blockFloorDom.classList.add('disabled')
                            disabledOptions.push(blockFloorDom)
                        } else if (blockFloorBasedPercentage === 100) {
                            blockFloorDom.style.backgroundColor = 'green'
                            activeOptions.push(blockFloorDom)
                        } else if (blockFloor.attendanceCount > 0 && blockFloorBasedPercentage < 99) {
                            blockFloorDom.style.backgroundColor = 'orange'
                            activeOptions.push(blockFloorDom)
                        } else {
                            blockFloorDom.style.backgroundColor = 'red'
                            activeOptions.push(blockFloorDom)
                        }

                        activeOptions.forEach(blockFloor => {
                            floorNumber.appendChild(blockFloor);
                        })

                        disabledOptions.forEach(blockFloor => {
                            floorNumber.appendChild(blockFloor);
                        })

                        blockFloorDom.onclick = () => {
                            currentBlockFloorId = blockFloor.blockFloorId;
                            floorNumber.value = blockFloor.blockFloorId;
                            populateRoomNumber(blockFloor.blockFloorId);
                            floorNumberContainer.style.display = 'none';
                            roomNumberContainer.style.display = 'block';
                        };
                    })
                } catch (error) {
                    console.log('Error fetching BlockFloor codes:', error);
                }
            }

            async function populateRoomNumber(blockFloorId) {
                roomNumber.innerHTML = '';
                var activeOptions = [];
                var disabledOptions = [];
                try {
                    if (!checkIn.value || checkIn.value > today) {
                        return;
                    }

                    const myParam = urlParams.get('roomId');
                    const url = myParam ? `http://localhost:1000/api/attendance/room?date=${checkIn.value}&blockFloorId=${myParam}` :
                        `http://localhost:1000/api/attendance/room?date=${checkIn.value}&blockFloorId=${blockFloorId}`;

                    if (myParam) {
                        roomNumber.value = myParam;
                        return populateStudentList(myParam);
                    }

                    var myHeaders = new Headers();

                    var requestOptions = {
                        method: 'GET',
                        headers: myHeaders,
                        redirect: 'follow'
                    };

                    const response = await fetch(url);
                    const rooms = await response.json();

                    rooms.forEach(async (room) => {
                        const roomDom = document.createElement('button');
                        roomDom.className = 'btn btn-secondary me-2';
                        roomDom.value = room.roomId;
                        roomDom.textContent = room.roomNumber;
                        var roomBasedPercentage = (room.attendanceCount / room.studentsCount) * 100

                        if (room.studentsCount === 0) {
                            roomDom.classList.add('disabled')
                            disabledOptions.push(roomDom)
                        } else if (roomBasedPercentage === 100) {
                            roomDom.style.backgroundColor = 'green'
                            activeOptions.push(roomDom)
                        } else if (room.attendanceCount > 0 && roomBasedPercentage < 99) {
                            roomDom.style.backgroundColor = 'orange'
                            activeOptions.push(roomDom)
                        } else {
                            roomDom.style.backgroundColor = 'red'
                            activeOptions.push(roomDom)
                        }

                        activeOptions.forEach(room => {
                            roomNumber.appendChild(room);
                        })

                        disabledOptions.forEach(room => {
                            roomNumber.appendChild(room);
                        })

                        roomDom.onclick = () => {
                            currentRoomId = room.roomId;
                            roomNumber.value = room.roomId;
                            populateStudentList(room.roomId);
                            roomNumberContainer.style.display = 'none';
                            studentContainer.style.display = 'block';
                        };
                    });

                } catch (error) {
                    console.log('Error fetching Room codes:', error);
                }
            }

            async function populateStudentList(roomId) {
                studentList.innerHTML = '';

                try {
                    const response = await fetch(`http://localhost:1000/api/attendance/student/${roomId}?checkIn=${checkIn.value}`);
                    const students = await response.json();


                    students.forEach(student => {
                        const isPresentChecked = student.isPresent === 1 ? 'checked' : '';
                        const isAbsentChecked = student.isPresent === 0 ? 'checked' : '';

                        const li = document.createElement('li');
                        li.classList.add('list-group-item');
                        li.innerHTML = `
                        <span class="me-4">${student.name}</span>
                        <div class="form-check form-check-inline float-right">
                            <input class="form-check-input" type="radio" name="isPresent_${student.studentId}" value="1" id="present_${student.studentId}" ${isPresentChecked} checked>
                            <label class="form-check-label" for="present_${student.studentId}">Present</label>
                        </div>
                        <div class="form-check form-check-inline float-right">
                            <input class="form-check-input" type="radio" name="isPresent_${student.studentId}" value="0" id="absent_${student.studentId}" ${isAbsentChecked}>
                            <label class="form-check-label" for="absent_${student.studentId}">Absent</label>
                        </div>`;

                        studentList.appendChild(li);
                    });
                    blockCodeContainer.style.display = 'none';
                    studentContainer.style.display = 'block';

                } catch (error) {
                    console.log('Error fetching student list:', error);
                }
            }


            checkIn.addEventListener('change', () => {
                if (checkIn.value > today) {
                    alert('Date cannot be in the future');
                    // status.style.display = 'none'
                }

                if (floorNumberContainer.style.display === 'block') {
                    return populateFloorNumber(currentBlockId)
                } else if (roomNumberContainer.style.display === 'block') {
                    return populateRoomNumber(currentBlockFloorId);
                } else if (studentContainer.style.display === 'block') {
                    return populateStudentList(currentRoomId)
                }
            });

            window.addEventListener('load', () => {
                populateBlockCode()
            })
        </script>