import AWS from "aws-sdk";

// Set your AWS credentials
const s3 = new AWS.S3({
    region: import.meta.env.VITE_AWS_REGION, // e.g., 'us-east-1'
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID, // e.g., 'us-east-1'
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY, // e.g., 'us-east-1'
});


export const uploadFile = (file) => {


    const fileName = String(file.name).replace(" ", "");


    const params = {
        Bucket: import.meta.env.VITE_BUCKET_NAME,
        Key: fileName, // The name of the file you want to save as in S3
        Body: file, // The file object
        ContentType: file.type, // MIME type of the file
        ACL: 'private', // Set to 'private' if you want restricted access
    };

    s3.putObject(params, (err, data) => {
        if (err) {
            console.error('Error uploading file:', err);
        } else {
            console.log('File uploaded successfully:', data);
        }
    });

};

export const downloadFile = (fileName) => {
    const params = {
        Bucket: import.meta.env.VITE_BUCKET_NAME,
        Key: fileName,
    };

    s3.getObject(params, (err, data) => {
        if (err) {
            console.error('Error downloading file:', err);
        } else {
            // Create a Blob from the file data
            const blob = new Blob([data.Body], { type: data.ContentType });

            // Create a link element to trigger the download
            const link = document.createElement('a');
            const url = window.URL.createObjectURL(blob);

            link.href = url;
            link.download = fileName; // The filename for the downloaded file

            // Programmatically click the link to trigger the download
            link.click();

            // Clean up the object URL after the download
            window.URL.revokeObjectURL(url);
        }
    });
};