
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        const updates = [];
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                // defer updates until all the DOM shuffling is done
                updates.push(() => block.p(child_ctx, dirty));
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        run_all(updates);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Minesweeper.svelte generated by Svelte v3.59.2 */

    const file$1 = "src\\Minesweeper.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[17] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	child_ctx[20] = i;
    	return child_ctx;
    }

    // (203:10) {#if cell.isRevealed && !cell.isMine}
    function create_if_block_2(ctx) {
    	let t_value = (/*cell*/ ctx[18].surroundingMines > 0
    	? /*cell*/ ctx[18].surroundingMines
    	: '') + "";

    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*grid*/ 1 && t_value !== (t_value = (/*cell*/ ctx[18].surroundingMines > 0
    			? /*cell*/ ctx[18].surroundingMines
    			: '') + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(203:10) {#if cell.isRevealed && !cell.isMine}",
    		ctx
    	});

    	return block;
    }

    // (189:6) {#each row as cell, j (j)}
    function create_each_block_1(key_1, ctx) {
    	let div;
    	let t;
    	let div_class_value;
    	let div_aria_label_value;
    	let mounted;
    	let dispose;
    	let if_block = /*cell*/ ctx[18].isRevealed && !/*cell*/ ctx[18].isMine && create_if_block_2(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[6](/*i*/ ctx[17], /*j*/ ctx[20]);
    	}

    	function keydown_handler(...args) {
    		return /*keydown_handler*/ ctx[7](/*i*/ ctx[17], /*j*/ ctx[20], ...args);
    	}

    	function contextmenu_handler() {
    		return /*contextmenu_handler*/ ctx[8](/*i*/ ctx[17], /*j*/ ctx[20]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t = space();

    			attr_dev(div, "class", div_class_value = "cell " + (/*cell*/ ctx[18].isRevealed ? 'revealed' : '') + " " + (/*cell*/ ctx[18].isMine && /*cell*/ ctx[18].isRevealed
    			? 'mine'
    			: '') + " " + (/*cell*/ ctx[18].isFlagged ? 'flagged' : '') + " " + (/*cell*/ ctx[18].surroundingMines === 0 && /*cell*/ ctx[18].isRevealed
    			? 'zero'
    			: '') + " svelte-cs9qei");

    			attr_dev(div, "tabindex", "0");
    			attr_dev(div, "role", "button");

    			attr_dev(div, "aria-label", div_aria_label_value = `Cell (${/*i*/ ctx[17]}, ${/*j*/ ctx[20]}) ${/*cell*/ ctx[18].isMine
			? 'Mine'
			: /*cell*/ ctx[18].surroundingMines + ' surrounding mines'}`);

    			add_location(div, file$1, 189, 8, 4309);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "click", click_handler, false, false, false, false),
    					listen_dev(div, "keydown", keydown_handler, false, false, false, false),
    					listen_dev(div, "contextmenu", prevent_default(contextmenu_handler), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*cell*/ ctx[18].isRevealed && !/*cell*/ ctx[18].isMine) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(div, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*grid*/ 1 && div_class_value !== (div_class_value = "cell " + (/*cell*/ ctx[18].isRevealed ? 'revealed' : '') + " " + (/*cell*/ ctx[18].isMine && /*cell*/ ctx[18].isRevealed
    			? 'mine'
    			: '') + " " + (/*cell*/ ctx[18].isFlagged ? 'flagged' : '') + " " + (/*cell*/ ctx[18].surroundingMines === 0 && /*cell*/ ctx[18].isRevealed
    			? 'zero'
    			: '') + " svelte-cs9qei")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty & /*grid*/ 1 && div_aria_label_value !== (div_aria_label_value = `Cell (${/*i*/ ctx[17]}, ${/*j*/ ctx[20]}) ${/*cell*/ ctx[18].isMine
			? 'Mine'
			: /*cell*/ ctx[18].surroundingMines + ' surrounding mines'}`)) {
    				attr_dev(div, "aria-label", div_aria_label_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(189:6) {#each row as cell, j (j)}",
    		ctx
    	});

    	return block;
    }

    // (188:4) {#each grid as row, i (i)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let each_value_1 = /*row*/ ctx[15];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*j*/ ctx[20];
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*grid, revealCell, toggleFlag*/ 41) {
    				each_value_1 = /*row*/ ctx[15];
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, each_1_anchor.parentNode, destroy_block, create_each_block_1, each_1_anchor, get_each_context_1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(188:4) {#each grid as row, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (211:2) {#if gameOver}
    function create_if_block(ctx) {
    	let div;
    	let t0;
    	let button;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*gameWon*/ ctx[2]) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			t0 = space();
    			button = element("button");
    			button.textContent = "Play Again";
    			attr_dev(button, "class", "svelte-cs9qei");
    			add_location(button, file$1, 217, 6, 5302);
    			attr_dev(div, "class", "message svelte-cs9qei");
    			add_location(div, file$1, 211, 4, 5180);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*startNewGame*/ ctx[4], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(211:2) {#if gameOver}",
    		ctx
    	});

    	return block;
    }

    // (215:6) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("💣 Game Over!");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(215:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (213:6) {#if gameWon}
    function create_if_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("🎉 You Win!");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(213:6) {#if gameWon}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let h1;
    	let t1;
    	let div0;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t2;
    	let each_value = /*grid*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[17];
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	let if_block = /*gameOver*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Minesweeper";
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			if (if_block) if_block.c();
    			add_location(h1, file$1, 185, 2, 4191);
    			attr_dev(div0, "class", "grid svelte-cs9qei");
    			add_location(div0, file$1, 186, 2, 4215);
    			attr_dev(div1, "class", "container svelte-cs9qei");
    			add_location(div1, file$1, 184, 0, 4164);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}

    			append_dev(div1, t2);
    			if (if_block) if_block.m(div1, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*grid, revealCell, toggleFlag*/ 41) {
    				each_value = /*grid*/ ctx[0];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div0, destroy_block, create_each_block, null, get_each_context);
    			}

    			if (/*gameOver*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Minesweeper', slots, []);
    	let gridSize = 10; // Grid size (10x10)
    	let numMines = 15; // Number of mines
    	let grid = [];
    	let gameOver = false;
    	let gameWon = false;

    	// Initialize the grid
    	function initializeGrid() {
    		$$invalidate(0, grid = []);

    		for (let i = 0; i < gridSize; i++) {
    			let row = [];

    			for (let j = 0; j < gridSize; j++) {
    				row.push({
    					isMine: false,
    					isRevealed: false,
    					isFlagged: false,
    					surroundingMines: 0
    				});
    			}

    			grid.push(row);
    		}

    		placeMines();
    		calculateSurroundingMines();
    	}

    	// Place mines randomly on the grid
    	function placeMines() {
    		let placedMines = 0;

    		while (placedMines < numMines) {
    			const x = Math.floor(Math.random() * gridSize);
    			const y = Math.floor(Math.random() * gridSize);

    			if (!grid[x][y].isMine) {
    				$$invalidate(0, grid[x][y].isMine = true, grid);
    				placedMines++;
    			}
    		}
    	}

    	// Calculate surrounding mines for each cell
    	function calculateSurroundingMines() {
    		for (let i = 0; i < gridSize; i++) {
    			for (let j = 0; j < gridSize; j++) {
    				if (grid[i][j].isMine) continue;
    				let count = 0;

    				for (let x = -1; x <= 1; x++) {
    					for (let y = -1; y <= 1; y++) {
    						const nx = i + x;
    						const ny = j + y;

    						if (nx >= 0 && ny >= 0 && nx < gridSize && ny < gridSize && grid[nx][ny].isMine) {
    							count++;
    						}
    					}
    				}

    				$$invalidate(0, grid[i][j].surroundingMines = count, grid);
    			}
    		}
    	}

    	// Handle cell click
    	function revealCell(x, y) {
    		if (gameOver || grid[x][y].isRevealed || grid[x][y].isFlagged) return;
    		$$invalidate(0, grid[x][y].isRevealed = true, grid);

    		// If it's a mine, change its background to red
    		if (grid[x][y].isMine) {
    			$$invalidate(0, grid[x][y].isRevealed = true, grid); // Make sure the mine is revealed
    			$$invalidate(1, gameOver = true);
    			return;
    		}

    		// If no surrounding mines, reveal surrounding cells recursively
    		if (grid[x][y].surroundingMines === 0) {
    			for (let dx = -1; dx <= 1; dx++) {
    				for (let dy = -1; dy <= 1; dy++) {
    					const nx = x + dx;
    					const ny = y + dy;

    					if (nx >= 0 && ny >= 0 && nx < gridSize && ny < gridSize && !grid[nx][ny].isRevealed) {
    						revealCell(nx, ny);
    					}
    				}
    			}
    		}

    		checkWin();
    	}

    	// Check if the player has won
    	function checkWin() {
    		let revealedCount = 0;

    		for (let i = 0; i < gridSize; i++) {
    			for (let j = 0; j < gridSize; j++) {
    				if (grid[i][j].isRevealed && !grid[i][j].isMine) {
    					revealedCount++;
    				}
    			}
    		}

    		if (revealedCount === gridSize * gridSize - numMines) {
    			$$invalidate(2, gameWon = true);
    			$$invalidate(1, gameOver = true);
    		}
    	}

    	// Start a new game
    	function startNewGame() {
    		$$invalidate(1, gameOver = false);
    		$$invalidate(2, gameWon = false);
    		initializeGrid();
    	}

    	// Toggle flagging a cell
    	function toggleFlag(x, y) {
    		if (gameOver || grid[x][y].isRevealed) return;
    		$$invalidate(0, grid[x][y].isFlagged = !grid[x][y].isFlagged, grid);
    	}

    	// Initialize the game
    	initializeGrid();

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Minesweeper> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (i, j) => revealCell(i, j);

    	const keydown_handler = (i, j, event) => {
    		if (event.key === "Enter" || event.key === " ") {
    			revealCell(i, j);
    		}
    	};

    	const contextmenu_handler = (i, j) => toggleFlag(i, j);

    	$$self.$capture_state = () => ({
    		gridSize,
    		numMines,
    		grid,
    		gameOver,
    		gameWon,
    		initializeGrid,
    		placeMines,
    		calculateSurroundingMines,
    		revealCell,
    		checkWin,
    		startNewGame,
    		toggleFlag
    	});

    	$$self.$inject_state = $$props => {
    		if ('gridSize' in $$props) gridSize = $$props.gridSize;
    		if ('numMines' in $$props) numMines = $$props.numMines;
    		if ('grid' in $$props) $$invalidate(0, grid = $$props.grid);
    		if ('gameOver' in $$props) $$invalidate(1, gameOver = $$props.gameOver);
    		if ('gameWon' in $$props) $$invalidate(2, gameWon = $$props.gameWon);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		grid,
    		gameOver,
    		gameWon,
    		revealCell,
    		startNewGame,
    		toggleFlag,
    		click_handler,
    		keydown_handler,
    		contextmenu_handler
    	];
    }

    class Minesweeper extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Minesweeper",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.59.2 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let minesweeper;
    	let current;
    	minesweeper = new Minesweeper({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(minesweeper.$$.fragment);
    			attr_dev(main, "class", "svelte-ns9461");
    			add_location(main, file, 4, 2, 75);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(minesweeper, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(minesweeper.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(minesweeper.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(minesweeper);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Minesweeper });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
