import { GetStaticPaths, GetStaticProps } from 'next';

export const validCategories = [
  'electronics',
  'vehicles',
  'books',
  'gaming',
  'furniture',
  'jobs',
  'home',
  'property',
  'fashion',
];

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = validCategories.map((category) => ({
    params: { category },
  }));

  return {
    paths,
    fallback: false, // invalid category = 404
  };
};

export const getStaticProps: GetStaticProps = async (context) => {
  const { category } = context.params as { category: string };

  return {
    props: {
      category,
    },
  };
};