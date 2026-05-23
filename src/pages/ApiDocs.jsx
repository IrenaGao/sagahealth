import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import apiDocsMarkdown from '../../API_DOCS.md?raw';

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <article className="prose prose-slate prose-headings:scroll-mt-20 prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-code:before:content-none prose-code:after:content-none max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
            {apiDocsMarkdown}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
