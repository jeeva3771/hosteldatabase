<%- include('../../partials/header.ejs', { isMenuVisible : true, title: 'Coursepage', userName: userName}) %>

module.exports = (app) => {
    app.get('/login', (req, res) => {
        res.render('pages/login')
    });

    app.get('/home', (req, res) => {
        if (req.session.isLogged === true) {
            res.render('pages/home','pages/courseList', {
                userName: req.session.data
            })
        } else {
            res.redirect('http://localhost:1000/login')
        }
    })
}

............................
<script>
        var user = <%=userName.firstName%> <%=userName.lastName%>
      </script>


.................................

<%- include('../../partials/header.ejs',{ isMenuVisible : true, title: 'Block' }) %>
<h2>Block</h2>
        <div class="form-group">
            <label for="blockCode">Block Code</label>
            <input type="text" class="form-control" id="blockCode">
        </div>
        <div class="form-group">
            <label for="blockLocation">Location</label>
            <input type="text" class="form-control" id="blockLocation">
        </div>
        <div class="form-group">
            <label for="status">Status</label><br>
            <div class="form-check form-check-inline">
                <input class="form-check-input" type="radio" name="status" id="isActive" value="1">
                <label class="form-check-label" for="isActive">Active</label>
            </div>
            <div class="form-check form-check-inline">
                <input class="form-check-input" type="radio" name="status" id="inActive" value="0">
                <label class="form-check-label" for="inActive">Inactive</label>
            </div>
        </div>
        <div class="submission">
            <input type="hidden" id="blockId" value="<%=blockId %>" />
            <button onclick="saveOrUpdateBlock()" class="btn btn-success" id="submitButton" disabled>Submit</button>
        </div>
        <%- include('../../partials/footer.ejs') %>
<script>
    var blockCode = document.getElementById('blockCode');
    var blockLocation = document.getElementById('blockLocation');
    var selectedStatus = document.querySelector('input[name="status"]');
    var submitButton = document.getElementById('submitButton');
    var blockId = document.getElementById('blockId').value;

    function saveOrUpdateBlock() {
        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        var raw = JSON.stringify({
            "blockCode": blockCode.value,
            "blockLocation": blockLocation.value,
            "isActive": parseInt(selectedStatus.checked.value)
        });

        var requestOptions = {
            method: blockId ? 'PUT' : 'POST',
            headers: myHeaders,
            body: raw
        };

        let url = "http://localhost:1000/api/block";
        if (blockId) {
            url = url + '/' + blockId
        }

        fetch(url, requestOptions)
            .then(response => response.text())
            .then(blocks => window.location = '/block')
            .catch(error => console.error('error', error));
    }

    if (blockId) {
        getBlock(blockId)
    }

    function getBlock(blockId) {
        const requestOptions = {
            method: "GET"
        };

        fetch("http://localhost:1000/api/block/" + blockId, requestOptions)
            .then((response) => response.json())
            .then((block) => {
                blockCode.value = block.blockCode
                blockLocation.value = block.blockLocation
                if (block.isActive) {
                    document.getElementById('isActive').checked = true;
                } else {
                    document.getElementById('inActive').checked = true;
                }
            })
            .catch((error) => console.error(error));
    }

    function toggleSubmitButton() {
        submitButton.disabled = !(
            blockCode.value.length > 0 &&
            blockLocation.value.length > 0 &&
            selectedStatus !== null
        )
    }

    blockCode.addEventListener('input', toggleSubmitButton);
    blockLocation.addEventListener('input', toggleSubmitButton);
    document.querySelectorAll('input[name="status"]').forEach(radio => radio.addEventListener('change', toggleSubmitButton));
</script>
