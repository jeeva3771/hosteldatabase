<%- include('../../partials/header.ejs', { isMenuVisible : true, title: 'Student' }) %>

    <h2>Student form</h2>
    <div class="form-group">
        <label for="studentName">Name</label>
        <input type="text" class="form-control" id="studentName">
    </div>
    <div class="form-group">
        <label for="registerNum">RegisterNumber</label>
        <input type="text" class="form-control" id="registerNum">
    </div>
    <div class="form-group">
        <label for="dob">DOB</label>
        <input type="date" class="form-control dateLabel" id="dob">
    </div>
    <div class="form-group">
        <label for="course">CourseName</label>
        <select class="form-control" id="course">
        </select>
    </div>
    <div class="form-group">
        <label for="email">EmailId</label>
        <input type="email" class="form-control" id="email">
    </div>
    <div class="form-group">
        <label for="studNum">PhoneNumber</label>
        <input type="number" class="form-control" id="studNum">
    </div>
    <div class="form-group">
        <label for="fatherName">FatherName</label>
        <input type="text" class="form-control" id="fatherName">
    </div>
    <div class="form-group">
        <label for="fatherNum">FatherNumber</label>
        <input type="number" class="form-control" id="fatherNum">
    </div>
    <div class="form-group">
        <label for="address">Address</label>
        <input type="text" class="form-control" id="address">
    </div>
    <div class="form-group">
        <label for="blockCode">BlockCode</label>
        <select class="form-control" id="blockCode">
        </select>
    </div>
    <div class="form-group">
        <label for="floorNumber">FloorNumber</label>
        <select class="form-control" id="floorNumber">
        </select>
    </div>
    <div class="form-group">
        <label for="roomNumber">RoomNumber</label>
        <select class="form-control" id="roomNumber">
        </select>
    </div>
    <div class="form-group">
        <label for="joinedDate">JoinedDate</label>
        <input type="date" class="form-control dateLabel" id="joinedDate">
    </div>
    <div class="submission">
        <input type="hidden" id="studentId" value="<%=studentId %>" />
        <button onclick="saveOrUpdateStudent()" class="btn btn-success" id="submitButton" disabled>Submit</button>
    </div>
    <%- include('../../partials/footer.ejs') %>
        <script>
            var studentName = document.getElementById('studentName');
            var registerNum = document.getElementById('registerNum');
            var dob = document.getElementById('dob');
            var course = document.getElementById('course');
            var emailId = document.getElementById('email');
            var studNum = document.getElementById('studNum');
            var fatherName = document.getElementById('fatherName');
            var fatherNum = document.getElementById('fatherNum');
            var address = document.getElementById('address');
            var blockCode = document.getElementById('blockCode');
            var floorNumber = document.getElementById('floorNumber');
            var roomNumber = document.getElementById('roomNumber');
            var joinedDate = document.getElementById('joinedDate');
            var submitButton = document.getElementById('submitButton');
            var studentId = document.getElementById('studentId').value;

            const today = new Date().toISOString().split('T')[0];
            joinedDate.value = today;

            function saveOrUpdateStudent() {
                var myHeaders = new Headers();
                myHeaders.append("Content-Type", "application/json");

                var raw = JSON.stringify({
                    "name": studentName.value,
                    "registerNumber": registerNum.value,
                    "dob": dob.value,
                    "courseId": course.value,
                    "emailId": emailId.value,
                    "phoneNumber": studNum.value,
                    "fatherName": fatherName.value,
                    "fatherNumber": fatherNum.value,
                    "address": address.value,
                    "blockId": blockCode.value,
                    "blockFloorId": floorNumber.value,
                    "roomId": roomNumber.value,
                    "joinedDate": joinedDate.value
                });

                var requestOptions = {
                    method: studentId ? 'PUT' : 'POST',
                    headers: myHeaders,
                    body: raw
                };

                let url = "http://localhost:1000/api/student";
                if (studentId) {
                    url = url + '/' + studentId
                }

                fetch(url, requestOptions)
                    .then(response => response.text())
                    .then(students => window.location = '/student')
                    .catch(error => console.error('error', error));
            }

            function toggleSubmitButton() {
                submitButton.disabled = !(
                    studentName.value.length > 0 &&
                    registerNum.value.length > 0 &&
                    dob.value !== '' &&
                    course.value !== 'Select' &&
                    emailId.value.length > 0 &&
                    studNum.value.length > 0 &&
                    fatherName.value.length > 0 &&
                    fatherNum.value.length > 0 &&
                    address.value.length > 0 &&
                    blockCode.value !== 'Select' &&
                    floorNumber.value !== 'Select' &&
                    roomNumber.value !== 'Select' &&
                    joinedDate.value !== ''
                )
            }

            async function initializeForm() {

                await populateCourse()
                await populateBlockCode();
                await populateFloorNumber();
                await populateRoomNumber()

                if (studentId) {
                    await getStudentById(studentId);
                }

                async function populateCourse() {
                    try {
                        const response = await fetch("http://localhost:1000/api/course")
                        const responseData = await response.json()
                        const { courses } = responseData
                        var optionsList = '<option selected>Select</option>'
                        courses.forEach(course => {
                            optionsList += `<option value="${course.courseId}">${course.courseName}</option>`
                        })
                        course.innerHTML = optionsList
                    } catch (error) {
                        console.log('Error fetching course:', error);
                    }
                }

                async function populateBlockCode() {
                    try {
                        const response = await fetch('http://localhost:1000/api/block');
                        const responseData = await response.json();
                        const { blocks } = responseData;

                        let optionsList = '<option selected>Select</option>';
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
                        const response = await fetch("http://localhost:1000/api/blockfloor")
                        const responseData = await response.json();
                        const { blockFloors } = responseData
                        var optionsList = '<option selected>Select</option>'
                        blockFloors.forEach(blockFloor => {
                            optionsList += `<option value="${blockFloor.blockFloorId}">${blockFloor.floorNumber}</option>`
                        })
                        floorNumber.innerHTML = optionsList
                    } catch (error) {
                        console.log('Error fetching floor Number:', error);
                    }
                }

                async function populateRoomNumber() {
                    try {
                        const response = await fetch("http://localhost:1000/api/room")
                        const responseData = await response.json()
                        const { rooms } = responseData
                        var optionsList = '<option selected>Select</option>'
                        rooms.forEach(room => {
                            optionsList += `<option value="${room.roomId}">${room.roomNumber}</option>`
                        })
                        roomNumber.innerHTML = optionsList
                    } catch (error) {
                        console.log('Error fetching room Number:', error);
                    }
                }

                studentName.addEventListener('input', toggleSubmitButton);
                registerNum.addEventListener('input', toggleSubmitButton);
                dob.addEventListener('input', toggleSubmitButton);
                course.addEventListener('change', toggleSubmitButton);
                emailId.addEventListener('input', toggleSubmitButton);
                studNum.addEventListener('input', toggleSubmitButton);
                fatherName.addEventListener('input', toggleSubmitButton);
                fatherNum.addEventListener('change', toggleSubmitButton);
                address.addEventListener('change', toggleSubmitButton);
                blockCode.addEventListener('input', toggleSubmitButton);
                floorNumber.addEventListener('input', toggleSubmitButton);
                roomNumber.addEventListener('input', toggleSubmitButton);
                joinedDate.addEventListener('input', toggleSubmitButton);


                async function getStudentById(studentId) {
                    try {
                        const response = await fetch("http://localhost:1000/api/student/" + studentId);
                        const student = await response.json();
                        studentName.value = student.name
                        registerNum.value = student.registerNumber
                        dob.value = student.dob.split('T')[0]
                        course.value = student.courseId
                        emailId.value = student.emailId
                        studNum.value = student.phoneNumber
                        fatherName.value = student.fatherName
                        fatherNum.value = student.fatherNumber
                        address.value = student.address
                        blockCode.value = student.blockId
                        floorNumber.value = student.blockFloorId
                        roomNumber.value = student.roomId
                        joinedDate.value = student.joinedDate.split('T')[0]
                    } catch (error) {
                        console.error('Error fetching student details:', error);
                    }
                }
            }

            initializeForm();

        </script>