import { useCallback } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import PrismicDOM, { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser, FiClock } from "react-icons/fi";
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';


import Comments from '../../components/Comments'
import { useState } from 'react';

interface PostLink {
  uid?: string;
  data: {
    title: string;
  }
}


interface Post {
  uid?: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  prevPost: PostLink;
  nextPost: PostLink;
  preview: boolean;
}

export default function Post({post, prevPost, nextPost, preview}: PostProps): JSX.Element {

  const { first_publication_date, last_publication_date, data } = post;
  const { title, author, banner, content } = data;
  const { url } = banner;


  const router = useRouter()

  const estimatedTimeToRead = useCallback(() => {
    const contentArray = content.reduce((acc, cur) => {
      return [...acc, ...cur.body];
    }, []);

    const allBodyString = PrismicDOM.RichText.asText(contentArray);

    const time = Math.ceil(allBodyString.split(' ').length / 200);

    return time;
  }, [content]);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return(
    <>
    <img src={url} className={styles.img}/>

      <div className={styles.post}>
        <h1>{title}</h1>
        <FiCalendar className={styles.icon} />
        <time>
          {
            format(
              new Date(first_publication_date),
              'dd MMM yyyy',
              { locale: ptBR }
            )
          }
        </time>
        <FiUser className={styles.icon} />
        <span>{author}</span>
        <FiClock className={styles.icon} />
        <span>{estimatedTimeToRead()} min</span>
        {
          last_publication_date !== first_publication_date &&
          <p className={styles.edit}>
            {`* editado em
            ${
              format(
                new Date(last_publication_date),
                'dd MMM yyyy',
                { locale: ptBR }
              )
            }, às
          ${
            format(
              new Date(last_publication_date),
              'hh:mm',
              { locale: ptBR }
            )
          }
          `}</p>
        }

        <article className={styles.article}>
          {
            content.map(art => (
              <div key={art.heading}>
                <h1>{art.heading}</h1>
                <div dangerouslySetInnerHTML={{__html: RichText.asHtml(art.body)}} />
              </div>
            ))
          }
        </article>
        <section className={styles.navigation}>
          <div>
            {prevPost && (
              <>
                <h3>{prevPost.data.title}</h3>
                <Link href={`/post/${prevPost.uid}`}>
                  <a>Post anterior</a>
                </Link>
              </>
            )}
          </div>
          <div>
            {nextPost && (
              <>
                <h3>{nextPost.data.title}</h3>
                <Link href={`/post/${nextPost.uid}`}>
                  <a>Próximo post</a>
                </Link>
              </>
            )}
          </div>
        </section>
        <Comments />
        {preview && (
          <aside>
            <Link href="/api/exit-preview">
              <a className={commonStyles.preview}>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </div>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query('');

  const paths = posts.results.map(post => {
    return {
      params: { slug: post.uid },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
    params,
    previewData,
    preview = false,
  })  => {

  const prismic = getPrismicClient();
  const { slug } = params
  const response = await prismic.getByUID('post', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const prevPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
    }
  );

  return {
    props: {
      post: {
        first_publication_date: response.first_publication_date,
        last_publication_date: response.last_publication_date,
        data: response.data,
        uid: response.uid
      },
      prevPost: prevPost?.results[0] ?? null,
      nextPost: nextPost?.results[0] ?? null,
      preview
    },
    redirect: 60 * 30 // 30 min
  }
}
