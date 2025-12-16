import { z } from 'zod';

// お問い合わせフォームのバリデーションスキーマ
// フロントエンドとサーバーサイドの両方で使用可能
export const contactSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'お名前を入力してください' })
    .max(100, { message: 'お名前は100文字以内で入力してください' }),
  
  email: z
    .string()
    .min(1, { message: 'メールアドレスを入力してください' })
    .email({ message: '正しいメールアドレスの形式で入力してください' }),
  
  subject: z
    .string()
    .max(100, { message: '件名は100文字以内で入力してください' })
    .optional(),
  
  message: z
    .string()
    .min(1, { message: 'お問い合わせ内容を入力してください' })
    .max(1000, { message: 'お問い合わせ内容は1000文字以内で入力してください' }),
});

// スキーマから型を抽出してエクスポート
export type ContactFormValues = z.infer<typeof contactSchema>;
