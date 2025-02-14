import { fileURLToPath } from 'node:url';
import { createMarkdownProcessor, type MarkdownProcessor } from '@astrojs/markdown-remark';
import { safeParseFrontmatter } from '../content/utils.js';
import type { ContentEntryType } from '../types/public/content.js';
import type { AstroConfig } from '../types/public/index.js';
import { getModuleCode } from './index.js';

export function getContentEntryType({
	astroConfig,
}: {
	astroConfig: AstroConfig;
}): ContentEntryType {
	let processor: Promise<MarkdownProcessor> | undefined;
	return {
		extensions: ['.md'],
		async getEntryInfo({ contents, fileUrl }: { contents: string; fileUrl: URL }) {
			const parsed = safeParseFrontmatter(contents, fileURLToPath(fileUrl));
			return {
				data: parsed.frontmatter,
				body: parsed.content.trim(),
				slug: parsed.frontmatter.slug,
				rawData: parsed.rawFrontmatter,
			};
		},
		// We need to handle propagation for Markdown because they support layouts which will bring in styles.
		handlePropagation: true,

		async getRenderModule({ contents, fileUrl: fileURL, viteId }) {
			const fileId = viteId.split('?')[0];
			const fileUrl = fileURLToPath(fileURL);
			const parsed = safeParseFrontmatter(contents, fileUrl);

			if (!processor) {
				processor = createMarkdownProcessor(astroConfig.markdown);
			}

			const code = await getModuleCode({
				processor: await processor,
				id: viteId,
				fileId,
				fileUrl,
				fileURL,
				raw: parsed,
			});

			return { code };
		},
	};
}
