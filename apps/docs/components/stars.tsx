export const getStaticProps = ({ params }) => {
  return fetch(`https://api.github.com/repos/abhay-ramesh/next-s3-uploader`)
    .then((res) => res.json())
    .then((repo) => ({
      props: {
        // We add an `ssg` field to the page props,
        // which will be provided to the Nextra `useData` hook.
        ssg: {
          stars: repo.stargazers_count,
        },
      },
      // The page will be considered as stale and regenerated every 60 seconds.
      revalidate: 60,
    }));
};

export const Stars = () => {
  // Get the data from SSG, and render it as a component.
  const { stars } = useData<{ stars: number }>();
  return <strong>{stars}</strong>;
};
