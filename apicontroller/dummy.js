// async function updateWardenAvatar(req, res) {
//     const wardenId = req.params.wardenId;

//     if (wardenId !== req.session.warden.wardenId && req.session.warden.superAdmin !== 1) {
//         return res.status(409).send('Warden is not valid to edit')
//     }

//     try {
//         const uploadedFilePath = req.file.path;
//         const originalDir = path.dirname(uploadedFilePath);

//         const tempFilePath = path.join(originalDir, `${uniqueSuffix}${wardenId}`);
//         const finalFilePath = path.join(originalDir, `${wardenId}.jpg`);

//         await sharp(uploadedFilePath)
//             .resize({
//                 width: parseInt(process.env.IMAGE_WIDTH),
//                 height: parseInt(process.env.IMAGE_HEIGHT),
//                 fit: sharp.fit.cover,
//                 position: sharp.strategy.center,
//             })
//             .toFile(tempFilePath);

//         fs.rename(tempFilePath, finalFilePath, (err) => {
//             if (err) {
//                 return res.status(400).json('Error renaming file');
//             }

//             return res.status(200).json('Warden profile updated successfully');
//         });
//     } catch (error) {
//         console.error('Error updating avatar:', error);
//         return res.status(500).json('Internal server error');
//     }
// }

async function studentReport(req, res) {
    const mysqlClient = req.app.mysqlClient;
    const {
        month,
        year
    } = req.query
    var errors = []

    if (isNaN(month)) {
        errors.push('month')
    }

    if (isNaN(year)) {
        errors.push('year')
    }

    if (studentName === "Select a Student") {
        errors.push('student')
    }

    if (errors.length > 0) {
        let errorMessage;

        if (errors.length === 1) {
            errorMessage = `Please select a ${errors[0]} before generating the report.`
        } else {
            errorMessage = `Please select a ${errors.join(", ")} before generating the report.`
        }

        return res.status(400).send(errorMessage)
    }

    try {
        const studentReport = await mysqlQuery(/*sql*/`
        SELECT 
            DATE_FORMAT(a.checkInDate, "%Y-%m-%d") AS checkIn,
            a.isPresent
        FROM 
            attendance AS a
        INNER JOIN 
            student AS s ON s.studentId = a.studentId
        WHERE 
            MONTH(a.checkInDate) = ?
            AND YEAR(a.checkInDate) = ?
            AND s.name = ?`,
            [month, year, studentName], mysqlClient)

        if (studentReport.length === 0) {
            return res.status(404).send('Student attendance report not found for the selected month and year.')
        }

        const formattedReport = studentReport.reduce((acc, { checkIn, isPresent }) => {
            acc[checkIn] = isPresent;
            return acc;
        }, {});

        return res.status(200).send(formattedReport);
    } catch (error) {
        res.status(500).send(error.message)
    }
}
