
/**
 * This is intended to duck type to TreeNode in @atomist/tree-path
 * We do not implement its optional parent property.
 * We require its optional value and offset properties.
 */
export interface TreeNodeCompatible<T extends TreeNodeCompatible = TreeNodeCompatible> {

    /**
     * Name of the node, available in path expressions
     */
    readonly $name: string;

    /**
     * Children of the node if it's a non-terminal
     */
    $children?: T[];

    /**
     * String represented by this tree node
     */
    $value: string;

    /**
     * Offset from 0 in the file
     */
    readonly $offset: number;

}
