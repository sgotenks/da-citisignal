const query = `query getCategoriesInCategory($id: String!) {
    categories(
        ids: [$id]
        subtree: { depth: 4, startLevel: 1 }
    ) {
        id
        level
        name
        path
        urlKey
        urlPath
        parentId
    }
}`;

export default query.replaceAll(/(?:\r\n|\r|\n|\t|[\s]{4})/g, ' ');
