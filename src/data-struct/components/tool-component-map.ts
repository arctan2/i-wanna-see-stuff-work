import { ElementLLNode } from "../linked-list/el-node";

import { ElementGNode } from "../graph/el-node";
import { ElementUEdge } from "../graph/el-u-edge";
import { ElementDEdge } from "../graph/el-d-edge";
import { ElementAdjMatrix } from "../graph/el-adjmatrix";
import { ElementBtreeNode } from "../btree/el-btree-node";
import { ElementBptreeNode } from "../bptree/el-bptree-node";
import { ElementLLRbtreeNode } from "../llrbtree/el-llrbtree-node";
import { ElementTrieNode } from "../trie/el-trie-node";
import { ElementHeapBuffer } from "../heap/el-heap-buffer";

import LLNodeComp from "./tools/ll-node.vue";
import GNodeComp from "./tools/g-node.vue";
import UEdgeComp from "./tools/u-edge.vue";
import DEdgeComp from "./tools/d-edge.vue";
import AdjMatrixComp from "./tools/adjmatrix.vue";
import BtreeNodeComp from "./tools/btree-comp.vue";
import BptreeNodeComp from "./tools/bptree-comp.vue";
import LLRbtreeNodeComp from "./tools/llrbtree-comp.vue";
import TrieNodeComp from "./tools/trie-comp.vue";
import HeapComp from "./tools/heap-comp.vue";

type ComponentMap = { [_:string]: any };

export const componentMap: ComponentMap = {
	[ElementLLNode.name]: LLNodeComp,
	[ElementGNode.name]: GNodeComp,
	[ElementUEdge.name]: UEdgeComp,
	[ElementDEdge.name]: DEdgeComp,
	[ElementAdjMatrix.name]: AdjMatrixComp,
	[ElementBtreeNode.name]: BtreeNodeComp,
	[ElementBptreeNode.name]: BptreeNodeComp,
	[ElementLLRbtreeNode.name]: LLRbtreeNodeComp,
	[ElementTrieNode.name]: TrieNodeComp,
	[ElementHeapBuffer.name]: HeapComp,
};

