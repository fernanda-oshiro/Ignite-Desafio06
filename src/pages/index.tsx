import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Link from 'next/link';
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import { FiCalendar, FiUser } from "react-icons/fi";
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({postsPagination}: HomeProps) {
  const { results, next_page } = postsPagination;
  const [posts, setPosts] = useState({ results, next_page });

  async function getNewPost(): Promise<void> {
    if (postsPagination.next_page !== null) {
    const newPost = await getNextPage(posts.next_page);
    setPosts(prevState => {
      return {
        results: [...prevState.results, ...newPost.results],
        next_page: newPost.next_page,
      };
    });
  }
  };

  return (
    <div className={styles.posts}>
      <div>
        {posts.results &&
          posts.results.map(post => (
            <Link href={`post/${post.uid}`} key={post.uid}>
              <a>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <FiCalendar className={styles.icon} />
                <time>
                {
                  format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    { locale: ptBR }
                  )
                }
                </time>
                <FiUser className={styles.icon} />
                <span>{post.data.author}</span>
              </a>
            </Link>
          ))}
      </div>
      {!!posts.next_page && (
        <button onClick={() => getNewPost()} type="button" className={styles.loadingButton}>
          Carregar mais posts
        </button>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      pageSize: 2,
    }
  );

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    results,
    next_page: postsResponse.next_page,
  };

  return {
    props: {postsPagination},
  };
};

const getNextPage = async (page_link): Promise<PostPagination> => {
  const res = await fetch(page_link);
  const postsResponse = await res.json();

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    results,
    next_page: postsResponse.next_page,
  };

  return postsPagination;
};
