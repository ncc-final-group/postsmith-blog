'use client';

import Image from 'next/image';
import React from 'react';

const PostSmiths: React.FC = () => {
  return (
    <div className="min-h-screen">
      <div className="max-w-6xl">
        <div className="flex items-center justify-between">
          <h1 className="font-semilight flex items-center text-xl text-gray-800">
            블로그 관리
          </h1>
        </div>
      </div>

      <div className="max-w-6xl pt-1">
        <div className="flex flex-col items-center gap-4 border border-gray-300 bg-white p-8">
          <figure className="relative self-center h-64 w-64">
            <Image fill style={{ objectFit: 'contain' }} priority={true} src="/defaultProfile.png" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" alt={''} />
          </figure>
          <div className="flex flex-col gap-2 mx-8  w-full">
            <label className="text-base">블로그 닉네임</label>
            <input
              placeholder="기존 블로그 닉네임"
              className="border border-gray-500 rounded-md p-2 focus:outline-none focus:ring-0 w-full"
            />
          </div>

          <div className="flex flex-col gap-2 mx-8 w-full">
            <label className="text-base">블로그 설명</label>
            <input
              placeholder="기존 블로그 설명"
              className="border border-gray-500 rounded-md p-2 focus:outline-none focus:ring-0 w-full"
            />
          </div>

          <div className="flex flex-col gap-2 mx-8 w-full">
            <label className="text-base">블로그 이름</label>
            <input
              placeholder="기존 블로그 이름"
              className="border border-gray-500 rounded-md p-2 focus:outline-none focus:ring-0 w-full"
            />
          </div>

          <div className="flex flex-row justify-between items-end gap-2 mx-8 w-full">
            <div className="flex flex-row gap-2 items-end">
              <figure className="relative self-center h-8 w-8">
                <Image fill style={{ objectFit: 'contain' }} priority={true} src="/defaultProfile.png" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" alt={''} />
              </figure>
              <div className="text-gray-500 w-80">파비콘 | 파일형식 ICO</div>
            </div>
            <div className="flex flex-row gap-4">
              <button className="border border-gray-500 rounded-md text-xs text-gray-500 py-1 px-4">
                불러오기
              </button>
              <button className="border border-gray-500 rounded-md text-xs text-gray-500 py-1 px-4">
                삭제
              </button>
            </div>
          </div>

        </div>
        <div className="bg-gray-200 flex justify-end border border-gray-300 px-8 py-4 mt-auto">
          <button className="border border-gray-500 rounded-md py-1 px-8">
            변경사항 저장
          </button>
        </div>
      </div>
      <div className="max-w-6xl pt-4">
        <div className="flex flex-col items-start gap-4 border border-gray-300 bg-white px-8 py-4 mt-auto">
          <div className="flex items-center gap-2">
            <h1>운영 중인 블로그</h1>
          </div>

          <div className="m-auto flex flex-col items-center gap-3 w-full">
            <div className="flex justify-between items-end gap-2 w-full">
              <figure className="relative h-20 w-20">
                <Image fill style={{ objectFit: 'contain' }} priority={true} src="/defaultProfile.png" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" alt={''} />
              </figure>
              <div className="flex gap-4">
                <div className="flex flex-col justify-center w-[40rem]">
                  <div className="text-base font-medium">블로그 닉네임</div>
                  <div className="text-base font-medium">ddd.tistory.com</div>
                </div>
              </div>
              <div className="w-16 h-8 bg-black text-white flex items-center justify-center">
                대표
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-200 flex justify-end border border-gray-300 px-8 py-4 ml-auto">
          <button className="border border-gray-500 rounded-md px-8 py-1 hover:bg-gray-300 transition">
            변경사항 저장
          </button>
        </div>
      </div>

      <div className="max-w-6xl pt-4">
        <div className="flex flex-col items-start gap-4 border border-gray-300 bg-white p-4 w-full">
          <div className="flex items-center gap-2">
            <h1>운영 · 개설 현황</h1>
          </div>

          <div className="flex flex-col items-center gap-3 w-full">
            <div className="flex flex-col justify-between gap-2 w-full">
              <div className="flex justify-between w-full">
                <div className="w-[40rem] text-base">4개의 블로그를 더 운영할 수 있습니다.</div>
                <div className="w-36 text-right text-gray-500">운영 중인 블로그 1개</div>
              </div>

              <div className="flex justify-between w-full">
                <div className="w-[40rem] text-base">블로그 개설 가능 횟수가 9회 남았습니다.</div>
                <div className="w-36 text-right text-gray-500">과거 개설 횟수 1회</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostSmiths;
