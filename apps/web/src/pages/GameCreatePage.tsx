import { useState } from 'react';
import type { DragEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GameType, ProductCategory } from '@bgp/shared-types';
import { api } from '../lib/api';
import { CATEGORY_OPTIONS, GAME_TYPE_OPTIONS } from '../lib/gameOptions';

export function GameCreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('GIFTICON');
  const [productName, setProductName] = useState('');
  const [gameType, setGameType] = useState<GameType>('PINBALL');
  const [participantLimit, setParticipantLimit] = useState(10);
  const [entryFee, setEntryFee] = useState(300);
  const [recruitmentEndsAt, setRecruitmentEndsAt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !productName.trim() || !recruitmentEndsAt) {
      setError('모든 필수 항목을 입력해주세요.');
      return;
    }
    if (participantLimit < 2) {
      setError('참가 인원은 2명 이상이어야 합니다.');
      return;
    }
    if (entryFee <= 0) {
      setError('참가비는 0P보다 커야 합니다.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('productName', productName);
    formData.append('gameType', gameType);
    formData.append('participantLimit', String(participantLimit));
    formData.append('entryFee', String(entryFee));
    formData.append('recruitmentEndsAt', new Date(recruitmentEndsAt).toISOString());
    if (imageFile) {
      formData.append('image', imageFile);
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/api/games', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate(`/games/${response.data.game.id}`);
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        '모집글 생성에 실패했습니다.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const estimatedPool = participantLimit * entryFee;

  return (
    <div className="page-form">
      <h1>라운드 만들기</h1>
      <form onSubmit={handleSubmit}>
        <label>
          카테고리
          <div className="radio-group">
            {CATEGORY_OPTIONS.map(([value, label]) => (
              <label key={value} className="radio-option">
                <input
                  type="radio"
                  name="category"
                  checked={category === value}
                  onChange={() => setCategory(value)}
                />
                {label}
              </label>
            ))}
          </div>
        </label>

        <label>
          게임 종류
          <select value={gameType} onChange={(e) => setGameType(e.target.value as GameType)}>
            {GAME_TYPE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label>
          제목
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        <label>
          설명
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />
        </label>

        <label>
          상품명
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
          />
        </label>

        <label>
          상품 사진
          <div className="dropzone" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
            {imagePreview ? (
              <img src={imagePreview} alt="상품 미리보기" className="dropzone-preview" />
            ) : (
              <p>이미지를 드래그하거나 클릭해서 선택하세요 (jpg/png/webp/gif, 5MB 이하)</p>
            )}
            <input type="file" accept="image/*" onChange={(e) => handleFiles(e.target.files)} />
          </div>
        </label>

        <label>
          참가 인원
          <input
            type="number"
            min={2}
            value={participantLimit}
            onChange={(e) => setParticipantLimit(Number(e.target.value))}
            required
          />
        </label>

        <label>
          참가비 (포인트)
          <input
            type="number"
            min={1}
            value={entryFee}
            onChange={(e) => setEntryFee(Number(e.target.value))}
            required
          />
          <span className="field-hint">참가비는 현금이 아닌 포인트로만 결제됩니다.</span>
        </label>

        <label>
          모집 마감일시
          <input
            type="datetime-local"
            value={recruitmentEndsAt}
            onChange={(e) => setRecruitmentEndsAt(e.target.value)}
            required
          />
        </label>

        <p className="estimate">
          예상 모집 포인트: <strong>{estimatedPool.toLocaleString()}P</strong> ({participantLimit}명
          × {entryFee.toLocaleString()}P)
        </p>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '게시 중...' : '게시하기'}
        </button>
      </form>
    </div>
  );
}
