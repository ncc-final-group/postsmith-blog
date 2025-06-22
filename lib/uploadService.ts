const API_BASE_URL = process.env.NEXT_PUBLIC_API_SERVER || 'http://localhost:8080';

export interface UploadResponse {
  success: boolean;
  url?: string;
  fileName?: string;
  altText?: string;
  fileSize?: number;
  fileType?: string;
  mediaId?: number;
  message?: string;
}

export const uploadImageToServer = async (file: File, altText?: string, userId?: number, blogId?: number): Promise<UploadResponse> => {
  try {
    // 클라이언트 사이드 파일 크기 검증 (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        message: '파일 크기가 10MB를 초과했습니다. 더 작은 파일을 선택해주세요.',
      };
    }

    const formData = new FormData();
    formData.append('file', file);
    if (altText) {
      formData.append('altText', altText);
    }
    if (userId) {
      formData.append('userId', userId.toString());
    }
    if (blogId) {
      formData.append('blogId', blogId.toString());
    }

    const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result: UploadResponse = await response.json();
    return result;
  } catch (error) {
    // console.error('이미지 업로드 오류:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
};

export const uploadVideoToServer = async (file: File, altText?: string, userId?: number, blogId?: number): Promise<UploadResponse> => {
  try {
    // 클라이언트 사이드 파일 크기 검증 (50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return {
        success: false,
        message: '파일 크기가 50MB를 초과했습니다. 더 작은 파일을 선택해주세요.',
      };
    }

    const formData = new FormData();
    formData.append('file', file);
    if (altText) {
      formData.append('altText', altText);
    }
    if (userId) {
      formData.append('userId', userId.toString());
    }
    if (blogId) {
      formData.append('blogId', blogId.toString());
    }

    // console.log('FormData 내용:', { altText, userId, blogId });

    const response = await fetch(`${API_BASE_URL}/api/upload/video`, {
      method: 'POST',
      body: formData,
    });

    // console.log('응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();

      // console.error('응답 에러:', errorText);
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result: UploadResponse = await response.json();

    // console.log('업로드 성공:', result);
    return result;
  } catch (error) {
    // console.error('비디오 업로드 오류:', error);

    // console.error('에러 상세:', {
    //   name: error instanceof Error ? error.name : 'Unknown',
    //   message: error instanceof Error ? error.message : '알 수 없는 오류',
    //   stack: error instanceof Error ? error.stack : undefined,
    // });
    return {
      success: false,
      message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
};

export const uploadFileToServer = async (file: File, displayName?: string, userId?: number, blogId?: number): Promise<UploadResponse> => {
  try {
    // 클라이언트 사이드 파일 크기 검증 (50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return {
        success: false,
        message: '파일 크기가 50MB를 초과했습니다. 더 작은 파일을 선택해주세요.',
      };
    }

    const formData = new FormData();
    formData.append('file', file);
    if (displayName) {
      formData.append('displayName', displayName);
    }
    if (userId) {
      formData.append('userId', userId.toString());
    }
    if (blogId) {
      formData.append('blogId', blogId.toString());
    }

    const response = await fetch(`${API_BASE_URL}/api/upload/file`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result: UploadResponse = await response.json();
    return result;
  } catch (error) {
    // console.error('파일 업로드 오류:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
};

export const deleteMediaFromServer = async (mediaId: number): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/media/${mediaId}`, { method: 'DELETE' });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Delete failed: ${response.status} - ${errorText}`);
    }

    return { success: true };
  } catch (error) {
    // console.error('미디어 삭제 오류:', error);
    return { success: false, message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' };
  }
};
