'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';

const PostSmiths: React.FC = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [selectedBlog, setSelectedBlog] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    description: '',
  });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/blogs/userId/1`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setBlogs(data);
        setSelectedBlog(data[0]);
      });
  }, []);

  useEffect(() => {
    if (selectedBlog) {
      setFormData({
        name: selectedBlog.name ?? '',
        nickname: selectedBlog.nickname ?? '',
        description: selectedBlog.description ?? '',
      });
    }
  }, [selectedBlog]);

  const handleSelectBlog = (blog: any) => setSelectedBlog(blog);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = () => {
    if (!selectedBlog) return;

    const updatedBlog = {
      ...selectedBlog,
      name: formData.name,
      nickname: formData.nickname,
      description: formData.description,
    };

    fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/blogs/update/${selectedBlog.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedBlog),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to save blog changes');

        const text = await res.text();
        if (text) {
          return JSON.parse(text);
        } else {
          return {};
        }
      })
      .then(() => {
        setBlogs((prevBlogs) => prevBlogs.map((blog) => (blog.id === updatedBlog.id ? updatedBlog : blog)));
        setSelectedBlog(updatedBlog);
        alert('변경사항이 저장되었습니다.');
      })
      .catch(() => {
        alert('저장에 실패했습니다.');
      });
  };

  return (
    <div className="flex min-h-screen flex-col gap-4">
      <div className="max-w-6xl">
        <div className="mt-auto flex flex-col items-start gap-4 border border-gray-300 bg-white p-4">
          <h1 className="text-xl text-gray-800">운영 중인 블로그</h1>
          <div className="flex w-full flex-col items-center">
            {blogs.map((blog, index) => {
              const isSelected = blog === selectedBlog;
              return (
                <div
                  key={index}
                  onClick={() => handleSelectBlog(blog)}
                  className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-md p-2 transition ${isSelected ? 'bg-gray-100' : ''}`}
                >
                  <figure className="relative h-20 w-20 rounded-full bg-gray-200">
                    <Image fill style={{ objectFit: 'contain' }} priority src="/defaultProfile.png" alt="profile" />
                  </figure>
                  <div className="flex gap-4">
                    <div className="flex w-[40rem] flex-col justify-center">
                      <div className="text-base font-medium">{blog.nickname ?? '블로그 닉네임'}</div>
                      <div className="text-base font-medium">{blog.address ?? 'www.blogsmith.com'}</div>
                    </div>
                  </div>
                  <div className={`flex h-8 w-24 items-center justify-center text-white ${index === 0 ? 'bg-black' : 'bg-gray-400'}`}>{index === 0 ? '대표' : '대표로 설정'}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl pt-1">
        <div className="flex flex-col items-start gap-8 border border-gray-300 bg-white p-4">
          <h1 className="text-xl text-gray-800">블로그 관리</h1>
          <figure className="relative h-64 w-64 self-center rounded-full bg-gray-200">
            <Image fill style={{ objectFit: 'contain' }} priority src="/defaultProfile.png" alt="profile" />
          </figure>
          <div className="flex w-full flex-col gap-4">
            {['name', 'nickname', 'description'].map((field) => (
              <div key={field} className="flex w-full flex-col gap-2 px-8">
                <label className="text-base">{`블로그 ${field === 'name' ? '이름' : field === 'nickname' ? '닉네임' : '설명'}`}</label>
                <input
                  name={field}
                  value={formData[field as keyof typeof formData]}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-500 p-2 focus:ring-0 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end border border-gray-300 bg-gray-200 px-8 py-4">
          <button onClick={handleSaveChanges} className="rounded-md border border-gray-500 px-8 py-1">
            변경사항 저장
          </button>
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-4 border border-gray-300 bg-white p-4">
        <h1 className="text-xl text-gray-800">운영 · 개설 현황</h1>
        <div className="flex w-full flex-col gap-2">
          <div className="flex w-full justify-between">
            <div className="w-[40rem] text-base">{5 - blogs.length}개의 블로그를 더 운영할 수 있습니다.</div>
            <div className="w-36 text-right text-gray-500">운영 중인 블로그 {blogs.length}개</div>
          </div>
          <div className="flex w-full justify-between">
            <div className="w-[40rem] text-base">블로그 개설 가능 횟수가 {10 - blogs.length}회 남았습니다.</div>
            <div className="w-36 text-right text-gray-500">과거 개설 횟수 {blogs.length}회</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostSmiths;
