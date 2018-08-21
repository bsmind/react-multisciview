class Node {
	constructor(data, priority) {
		this.data = data;
		this.priority = priority;
		this.next = null;
	}
}

class PriorityQueue {
	constructor() {
		this.heap = [null];
	}

	length() {
		return this.heap.length - 1;
	}

	// insert data
	insert(data, priority) {
		const newNode = new Node(data, priority);
		this.heap.push(newNode);

		let currNodeIdx = this.heap.length - 1;
		let currNodeParentIdx = Math.floor(currNodeIdx / 2);
		while (
			this.heap[currNodeParentIdx] &&
            newNode.priority > this.heap[currNodeParentIdx].priority
		) {
			const parent = this.heap[currNodeParentIdx];
			this.heap[currNodeParentIdx] = newNode;
			this.heap[currNodeIdx] = parent;
			currNodeIdx = currNodeParentIdx;
			currNodeParentIdx = Math.floor(currNodeIdx / 2);
		}
	}

	// get data with the highest priority and remove from the heap
	front() {
		if (this.heap.length < 3) {
			const toReturn = this.heap.pop();
			this.heap[0] = null;
			return toReturn;
		}

		const toRemove = this.heap[1];

		this.heap[1] = this.heap.pop();
		let currIdx = 1;
		let [left, right] = [2 * currIdx, 2 * currIdx + 1];
		let currChildIdx =
            this.heap[right] &&
            this.heap[right].priority >= this.heap[left].priority
            	? right : left;

		while (this.heap[currChildIdx] &&
               this.heap[currIdx].priority <= this.heap[currChildIdx].priority) {
			const currNode = this.heap[currIdx];
			const currChildNode = this.heap[currChildIdx];
			this.heap[currChildIdx] = currNode;
			this.heap[currIdx] = currChildNode;

			currIdx = currChildIdx;
			[left, right] = [2 * currIdx, 2 * currIdx + 1];
			currChildIdx =
                this.heap[right] && this.heap[right].priority >= this.heap[left].priority
                	? right : left;
		}

		return toRemove;
	}

	delete(index) {
		if (index >= this.heap.length || index <= 1) {
			return;
		}

		// const toRemove = this.heap[index];

		this.heap[index] = this.heap.pop();
		let currIdx = index;
		let [left, right] = [2 * currIdx, 2 * currIdx + 1];
		let currChildIdx =
            this.heap[right] &&
            this.heap[right].priority >= this.heap[left].priority
            	? right : left;

		while (this.heap[currChildIdx] &&
               this.heap[currIdx].priority <= this.heap[currChildIdx].priority) {
			const currNode = this.heap[currIdx];
			const currChildNode = this.heap[currChildIdx];
			this.heap[currChildIdx] = currNode;
			this.heap[currIdx] = currChildNode;

			currIdx = currChildIdx;
			[left, right] = [2 * currIdx, 2 * currIdx + 1];
			currChildIdx =
                this.heap[right] && this.heap[right].priority >= this.heap[left].priority
                	? right : left;
		}
	}

	// replace data with new priority if same data exist, otherwise inter the data
	replace(data, priority, isEqual) {
		if (this.heap.length === 1) {
			this.insert(data, priority);
			return;
		}

		let i;
		for (i = 1; i < this.heap.length; ++i) {
			const node = this.heap[i];
			if (isEqual(node.data, data))
				break;
		}

		if (i === this.heap.length)
			this.insert(data, priority);
		else if (this.heap[i].priority === priority) {
			// do nothing
		} else {
			this.delete(i);
			this.insert(data, priority);
		}
	}
}

export default PriorityQueue;