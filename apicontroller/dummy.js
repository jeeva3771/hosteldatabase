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