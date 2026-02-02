// File processing without Firebase Storage
export const uploadFile = async (file, patentName, fileType) => {
  return {
    name: file.name,
    path: `${patentName}/${fileType}/${file.name}`,
    size: file.size,
    uploadedAt: new Date().toISOString()
  };
};