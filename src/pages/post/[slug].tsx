import { useCallback } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import PrismicDOM from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { FiCalendar, FiUser, FiClock } from "react-icons/fi";
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
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
}

export default function Post({post}: PostProps): JSX.Element {

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

  console.log(paths)

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params
  const response = await prismic.getByUID('post', String(slug), {});

  return {
    props: {
      post: {
        first_publication_date: response.first_publication_date,
        data: response.data,
        uid: response.uid
      }
    },
    redirect: 60 * 30 // 30 min
  }
}
