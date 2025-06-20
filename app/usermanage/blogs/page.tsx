'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';

const PostSmiths: React.FC = () => {
  const blogId = 9;
  const [blog, setBlog] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    description: '',
    address: '',
    logoImage: '',
  });
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [confirmDeleteChecked, setConfirmDeleteChecked] = useState(false);
  const [fileData, setFileData] = useState<{
    logoImage: File | null;
  }>({ logoImage: null });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/blogmanage/${blogId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setBlog(data);
        setFormData({
          name: data.name ?? '',
          nickname: data.nickname ?? '',
          description: data.description ?? '',
          address: data.address ?? '',
          logoImage: data.logoImage ?? '',
        });
      })
      .catch(() => {
        alert('블로그 정보를 불러오는 데 실패했습니다.');
      });
  }, [blogId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const uploadImage = async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    form.append('altText', '블로그 로고 이미지');
    form.append('userId', String(5));
    form.append('blogId', String(blog?.id ?? 0));

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/upload/image`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error('이미지 업로드 실패');
      const data = await res.json();
      return data.url;
    } catch (error) {
      alert('이미지 업로드에 실패했습니다.');
      return null;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileData({ logoImage: file });
    }
  };

  const handleSaveChanges = async () => {
    if (!blog) return;

    let finalLogoImage = formData.logoImage;

    if (fileData.logoImage) {
      const uploadedUrl = await uploadImage(fileData.logoImage);
      if (uploadedUrl) {
        finalLogoImage = uploadedUrl;
      } else {
        return;
      }
    }

    const logoImageToSave = finalLogoImage || '/defaultimage.png';

    const updatedBlog = {
      ...blog,
      name: formData.name,
      nickname: formData.nickname,
      description: formData.description,
      address: formData.address,
      logoImage: logoImageToSave ?? '',
    };

    fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/blogmanage/update/${blog.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedBlog),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to save blog changes');
        const text = await res.text();
        return text ? JSON.parse(text) : {};
      })
      .then(() => {
        setBlog(updatedBlog);
        alert('변경사항이 저장되었습니다.');
      })
      .catch(() => {
        alert('저장에 실패했습니다.');
      });
  };

  const handleDeleteClick = () => {
    if (!showDeleteWarning) {
      setShowDeleteWarning(true);
    } else if (confirmDeleteChecked && blog) {
      fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/blogmanage/delete/blogId/${blog.id}`, { method: 'DELETE' })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to delete blog');
          setBlog(null);
          alert('블로그가 삭제되었습니다.');
        })
        .catch(() => {
          alert('블로그 삭제에 실패했습니다.');
        });
    }
  };

  if (!blog) return <div>블로그 정보를 불러오는 중입니다...</div>;

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4">
      <div className="flex min-h-screen flex-col gap-4">
        <div className="max-w-6xl">
          <div className="mt-auto flex flex-col items-start gap-4 border border-gray-300 bg-white p-4">
            <h1 className="text-xl text-gray-800">블로그 관리</h1>

            <label className="relative h-64 w-64 cursor-pointer self-center rounded-full bg-gray-200">
              <Image
                fill
                style={{ objectFit: 'contain' }}
                priority
                src={fileData.logoImage ? URL.createObjectURL(fileData.logoImage) : formData.logoImage || '/defaultimage.png'}
                alt="logo"
              />
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>

            <div className="flex w-full flex-col gap-4">
              {(['name', 'nickname', 'description'] as const).map((field) => (
                <div key={field} className="flex w-full flex-col gap-2 px-8">
                  <label className="text-base">{`블로그 ${field === 'name' ? '이름' : field === 'nickname' ? '닉네임' : field === 'description' ? '설명' : '주소'}`}</label>
                  <input name={field} value={formData[field]} onChange={handleChange} className="w-full rounded-md border border-gray-500 p-2 focus:ring-0 focus:outline-none" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4 border border-gray-300 bg-gray-200 px-12 py-4">
            <div className="flex items-center gap-4 self-end">
              {showDeleteWarning && (
                <div className="mt-2 text-sm text-red-600">
                  <label className="mt-1 inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={confirmDeleteChecked} onChange={(e) => setConfirmDeleteChecked(e.target.checked)} />
                    블로그 삭제 후 데이터 복구가 불가합니다. 정말 삭제하시겠습니까?
                  </label>
                </div>
              )}
              <button
                onClick={handleDeleteClick}
                className={`rounded-md border px-6 py-1 ${
                  !showDeleteWarning ? 'border-red-500 text-red-600' : confirmDeleteChecked ? 'border-red-500 text-red-600' : 'cursor-not-allowed border-gray-400 text-gray-400'
                }`}
                disabled={showDeleteWarning && !confirmDeleteChecked}
              >
                블로그 삭제
              </button>
            </div>
            <button onClick={handleSaveChanges} className="rounded-md border border-gray-500 px-8 py-1">
              변경사항 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostSmiths;
