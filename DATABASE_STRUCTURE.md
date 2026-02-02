# Firebase Database Structure

## Collections

### 1. patents
```javascript
{
  id: "auto-generated",
  // Basic Info
  title: "Patent Title",
  status: "Under Booking", // or other status values
  
  // File Details (in order)
  form1: { name: "file.pdf", fileName: "timestamp_file.pdf", url: "download_url" },
  form21: { name: "file.pdf", fileName: "timestamp_file.pdf", url: "download_url" },
  representationSheet: { name: "file.pdf", fileName: "timestamp_file.pdf", url: "download_url" },
  form21Stamp: { name: "file.pdf", fileName: "timestamp_file.pdf", url: "download_url" },
  
  // Other Documents
  document1: { name: "file.pdf", fileName: "timestamp_file.pdf", url: "download_url" },
  document2: { name: "file.pdf", fileName: "timestamp_file.pdf", url: "download_url" },
  document3: { name: "file.pdf", fileName: "timestamp_file.pdf", url: "download_url" },
  
  // Position Details
  positions: [
    {
      positionNo: 1,
      authorName: "Author Name"
    }
  ],
  
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

### 2. authors
```javascript
{
  id: "patentId_positionId",
  // Author Details (in order)
  fullName: "Full Name",
  department: "Department",
  designation: "Designation",
  college: "College/Institution",
  email: "email@example.com",
  mobile: "1234567890",
  signatureFileName: "signature_position_1_timestamp.jpg",
  signatureUrl: "download_url",
  amount: "10000",
  pendingAmount: "5000",
  // Reference
  patentId: "patent_id_reference",
  positionId: "position_number",
  savedAt: "2024-01-01T00:00:00.000Z"
}
```

## Firebase Storage Structure

```
/{PatentTitle}/
  ├── form1/{timestamp_filename}
  ├── form21/{timestamp_filename}
  ├── representationSheet/{timestamp_filename}
  ├── form21Stamp/{timestamp_filename}
  ├── document1/{timestamp_filename}
  ├── document2/{timestamp_filename}
  └── document3/{timestamp_filename}

/signatures/
  └── signature_position_{positionNo}_{timestamp}.{ext}
```

## Data Flow

1. **Patent Creation**: Title + Status
2. **File Upload**: Files stored by patent title and file type
3. **Position Management**: Position number + Author assignment
4. **Author Details**: Complete author info with signature by position
5. **Amount Tracking**: Amount + Pending amount per position

## Benefits

1. **Organized Storage**: Files grouped by patent title and type
2. **Complete Details**: All required information stored in order
3. **Position-based**: Signatures organized by position number
4. **Structured Data**: Clean database with proper relationships