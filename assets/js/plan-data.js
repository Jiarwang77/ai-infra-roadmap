// 学习路线与各专题的内容数据。文本里的 `code` 和 **加粗** 会在渲染时转换。
window.PLAN_DATA = {
  stages: [
    {
      id: 's0', short: '基本功', title: '基本功：学会“算账”', weeks: '第 1 周', start: 1, end: 1,
      goal: '能在白板上快速估算显存、FLOPs、KV cache、通信量和理论延迟。',
      intro: '现场估算几乎每轮面试都会考，也是最容易拉开差距的地方。本站的「算账工具」可以用来对答案。',
      topics: [
        { id: 's0-t1', title: '训练显存', text: '混合精度 + Adam 每参数约 16 字节：BF16 权重 2、梯度 2、FP32 主权重 4、Adam 两个动量各 4，7B 模型仅模型状态就是 112 GB。激活每层约 `s·b·h·(34 + 5·a·s/h)` 字节（Megatron 公式；s 序列长度、b batch、h hidden、a head 数），selective recompute 和 FlashAttention 省掉的是 `5·a·s/h` 这一项。' },
        { id: 's0-t2', title: 'FLOPs 与 MFU', text: '训练约 `6·N·T`（前向 2NT、反向 4NT），推理每 token 约 `2·N`（N 参数量、T token 数），长序列还要加 attention 的 FLOPs。MFU = 实际 FLOPs/s ÷ 峰值 FLOPs/s。' },
        { id: 's0-t3', title: 'KV cache', text: '每 token 占 `2 × 层数 × KV head 数 × head_dim × 字节数`。Llama-3-70B（80 层、8 个 KV head、head_dim 128）BF16 下每 token 约 320 KB，8K 上下文约 2.5 GB。' },
        { id: 's0-t4', title: 'Roofline', text: 'H100 SXM：BF16 稠密 989 TFLOPS、HBM 3.35 TB/s，拐点约 295 FLOP/Byte。decode 时线性层的算术强度约等于 batch size，所以小 batch 一定是 memory-bound——这是理解推理优化和 weight-only 量化的钥匙。' },
        { id: 's0-t5', title: '集合通信', text: 'AllReduce / ReduceScatter / AllGather / All-to-All 的语义；Ring AllReduce 每卡收发约 `2(N−1)/N × M`；AllReduce = ReduceScatter + AllGather（理解 ZeRO 的前提）；用 α-β 模型估通信时间；分清 nccl-tests 里的 algbw 与 busbw。' },
        { id: 's0-t6', title: '硬件与互联', text: 'SM、Tensor Core、寄存器 / shared memory / L2 / HBM 层次；NVLink / NVSwitch、PCIe、InfiniBand / RoCE、GPUDirect RDMA。AMD 平台对照：xGMI 全互联、RCCL、CK / hipBLASLt。' },
        { id: 's0-t7', title: 'CUDA 与 PyTorch 基础', text: '线程层次、合并访存、bank conflict、occupancy、stream；PyTorch 的 caching allocator 与显存碎片、autograd 机制、torch.compile 的基本原理。' }
      ],
      resources: [
        { title: 'Transformer Math 101', by: 'EleutherAI', url: 'https://blog.eleuther.ai/transformer-math/' },
        { title: 'How to Scale Your Model', by: 'Google DeepMind', url: 'https://jax-ml.github.io/scaling-book/', note: '重点读 roofline 和 Transformer 计算两章' },
        { title: 'Programming Massively Parallel Processors', by: '教材', note: 'CUDA 基础薄弱时读前几章' },
        { title: 'GPU MODE 讲座', by: '社区', url: 'https://github.com/gpu-mode/lectures' },
        { title: 'NCCL 用户文档', by: 'NVIDIA', url: 'https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/index.html' },
        { title: 'nccl-tests', by: 'NVIDIA', url: 'https://github.com/NVIDIA/nccl-tests' }
      ],
      projects: [
        { id: 's0-p1', text: '在多卡上跑 nccl-tests（或 rccl-tests），画出 AllReduce 带宽随消息大小变化的曲线，解释小消息为什么受延迟主导。' },
        { id: 's0-p2', text: '用本站「算账工具」把 Llama-3-8B / 70B 的训练显存、KV cache、decode 延迟下界各算一遍，再和实测对比。' }
      ],
      quiz: [
        { q: '70B 模型用 BF16 部署在 8 张 H100 上（TP=8），batch=1 时每个 token 延迟的理论下界是多少？', a: '权重 70B × 2 B = 140 GB，每卡 17.5 GB。decode 每步至少要把本卡权重从 HBM 读一遍：17.5 GB ÷ 3.35 TB/s ≈ **5.2 ms**。再加上 KV cache 读取、TP 的 AllReduce 和 kernel 启动开销，实际延迟会明显高于这个下界。' },
        { q: '1024 张 H100、MFU 40%，用 15T tokens 训练 70B 模型要多少天？', a: '总 FLOPs ≈ 6 × 70e9 × 15e12 = 6.3e24；集群有效算力 = 1024 × 989e12 × 0.4 ≈ 4.05e17 FLOP/s；6.3e24 ÷ 4.05e17 ≈ 1.56e7 秒，约 **180 天**。' },
        { q: 'Llama-3-8B（32 层、8 个 KV head、head_dim 128）在 BF16 下，32 个请求各 8K 上下文的 KV cache 有多大？', a: '每 token：2 × 32 × 8 × 128 × 2 B = 128 KB。总 token 数 32 × 8192 = 262,144，合计 262,144 × 128 KB = **32 GiB**，已经接近 8B 模型权重（16 GB）的两倍。' },
        { q: '为什么 decode 阶段线性层的算术强度约等于 batch size？', a: '形状为 K×N 的线性层处理 B 个 token：FLOPs = 2·B·K·N；B 远小于 K、N 时，读写字节数主要是权重 2·K·N（BF16）。两者相除得到算术强度约为 B FLOP/Byte。H100 的拐点约 295，所以 batch 要到几百才会进入 compute-bound。' }
      ],
      bar: '给定模型规模和卡型，5 分钟内估出训练和推理所需显存、FLOPs 与理论耗时下界。'
    },
    {
      id: 's1', short: '多卡训练', title: '多卡训练：并行策略与工程', weeks: '第 2–4 周', start: 2, end: 4,
      goal: '给定模型和集群，能设计并行配置并说清每个维度的代价。',
      intro: '以 TorchTitan 为主线（FSDP2、TP、PP、CP、EP 都有，代码量适中），用 Megatron-Core 做对照——业界大规模预训练很多基于 Megatron 或其魔改版，面试官常用它的术语。每学一种并行，都要回答三个问题：**切了什么、通信什么（量多大、能否 overlap）、省了什么**。',
      topics: [
        { id: 's1-t1', title: '数据并行 DDP', text: '梯度分桶；反向过程中 AllReduce 与计算 overlap；梯度累积时用 `no_sync` 跳过通信。' },
        { id: 's1-t2', title: 'ZeRO 与 FSDP', text: 'ZeRO-1/2/3 依次切优化器状态、梯度、参数；ZeRO-1/2 通信量与 DDP 相同（约 2Ψ），ZeRO-3 为 1.5 倍；FSDP1 的 FlatParameter 与 FSDP2 按参数 DTensor 切分的区别；预取、`reshard_after_forward`、HSDP、CPU offload。' },
        { id: 's1-t3', title: '混合精度', text: 'FP16 为什么需要 loss scaling 而 BF16 通常不需要；FP32 主权重的作用；FP8 训练在算力、显存和通信上的收益（如 FSDP 的 FP8 AllGather）。' },
        { id: 's1-t4', title: '激活重计算', text: 'full 与 selective recompute 的取舍：selective 只重算 attention 中显存占用大、计算量小的部分。' },
        { id: 's1-t5', title: '张量并行 TP', text: 'Megatron 的 MLP 和 Attention 都是先列切、再行切，每层前向 2 次 AllReduce、反向 2 次；TP 一般不跨机；词表并行的 embedding 与 cross-entropy。' },
        { id: 's1-t6', title: '序列并行 SP', text: '把 LayerNorm、Dropout 的激活按序列维切开，AllReduce 拆成 ReduceScatter + AllGather，通信量不变但省激活显存。' },
        { id: 's1-t7', title: '流水线并行 PP', text: 'GPipe、1F1B、interleaved 1F1B 的 bubble（相对理想计算时间为 `(p−1)/m`，interleaved 降为 `(p−1)/(v·m)`）与显存差异；Zero Bubble 把反向拆成输入梯度和权重梯度来填空泡；DeepSeek 的 DualPipe。' },
        { id: 's1-t8', title: '上下文并行 CP', text: 'Ring Attention：KV 分块沿环传递 + online softmax，因果 mask 下要用 zigzag 切分做负载均衡；DeepSpeed-Ulysses：用 All-to-All 转成按 head 切，并行度受 head 数限制；以及两者的混合。' },
        { id: 's1-t9', title: '专家并行 EP', text: '路由与 All-to-All 的 dispatch / combine；负载均衡（aux loss 与 aux-loss-free bias）；grouped GEMM；DeepEP；MoE 层与 attention 层使用不同并行配置（Megatron 的 MoE Parallel Folding）。' },
        { id: 's1-t10', title: '组合与调优', text: '多维并行如何映射到 DeviceMesh：TP 放最内层对应机内 NVLink；最外层放最能容忍延迟的维度（Llama 3 选 DP，Megatron 默认顺序 tp-cp-ep-dp-pp 选 PP）。async TP、FSDP 预取等计算通信 overlap 手段。' },
        { id: 's1-t11', title: '工程稳定性', text: '分布式 checkpoint（分片、异步保存、换并行配置后 reshard）；NCCL hang 定位（PyTorch flight recorder）；慢节点检测；loss spike 与 NaN 排查。' }
      ],
      resources: [
        { title: 'The Ultra-Scale Playbook', by: 'Hugging Face', url: 'https://huggingface.co/spaces/nanotron/ultrascale-playbook', note: '主线读物' },
        { title: 'picotron', by: 'Hugging Face', url: 'https://github.com/huggingface/picotron', note: '配套的 4D 并行最小实现' },
        { title: 'TorchTitan', by: 'PyTorch', url: 'https://github.com/pytorch/torchtitan' },
        { title: 'Megatron-LM / Megatron-Core', by: 'NVIDIA', url: 'https://github.com/NVIDIA/Megatron-LM' },
        { title: 'Megatron-LM（TP）', by: 'arXiv 1909.08053', url: 'https://arxiv.org/abs/1909.08053' },
        { title: 'Megatron PTD-P（interleaved 1F1B）', by: 'arXiv 2104.04473', url: 'https://arxiv.org/abs/2104.04473' },
        { title: 'Reducing Activation Recomputation（SP、selective recompute）', by: 'arXiv 2205.05198', url: 'https://arxiv.org/abs/2205.05198' },
        { title: 'ZeRO', by: 'arXiv 1910.02054', url: 'https://arxiv.org/abs/1910.02054' },
        { title: 'PyTorch FSDP', by: 'arXiv 2304.11277', url: 'https://arxiv.org/abs/2304.11277' },
        { title: 'GPipe', by: 'arXiv 1811.06965', url: 'https://arxiv.org/abs/1811.06965' },
        { title: 'Zero Bubble Pipeline Parallelism', by: 'arXiv 2401.10241', url: 'https://arxiv.org/abs/2401.10241' },
        { title: 'Ring Attention', by: 'arXiv 2310.01889', url: 'https://arxiv.org/abs/2310.01889' },
        { title: 'DeepSpeed Ulysses', by: 'arXiv 2309.14509', url: 'https://arxiv.org/abs/2309.14509' },
        { title: 'The Llama 3 Herd of Models（基础设施章节）', by: 'arXiv 2407.21783', url: 'https://arxiv.org/abs/2407.21783' },
        { title: 'DeepSeek-V3 技术报告（训练基础设施部分）', by: 'arXiv 2412.19437', url: 'https://arxiv.org/abs/2412.19437' },
        { title: 'MegaScale', by: 'arXiv 2402.15627', url: 'https://arxiv.org/abs/2402.15627' },
        { title: 'DualPipe', by: 'DeepSeek', url: 'https://github.com/deepseek-ai/DualPipe' }
      ],
      projects: [
        { id: 's1-p1', text: '用 `torch.distributed` 手写 ColumnParallelLinear / RowParallelLinear 和一个简化版 ZeRO-1，验证数值与单卡一致。' },
        { id: 's1-p2', text: '在 TorchTitan 上训练 Llama-3-8B，扫几组 FSDP / TP / PP 配置，记录显存、吞吐和 MFU，用 Nsight Systems 或 PyTorch Profiler 确认通信是否被 overlap。' },
        { id: 's1-p3', text: '实现一个 1F1B 调度（可参考 picotron），画出各 stage 的时间线并标出 bubble。' }
      ],
      quiz: [
        { q: '70B 模型全参训练需要多少显存、至少几张 80 GB 卡、你会怎么切？', a: '模型状态 16 B × 70B ≈ **1.12 TB**（不含激活）。全部用 ZeRO-3 / FSDP 切分时，仅模型状态就要 14 张卡；加上激活、通信 buffer 和碎片，比较现实的起点是 32 张以上（4 台 8 卡机，开重计算）。常见切法：机内 TP=8（或 4）+ 跨机 PP + 外层 DP（ZeRO-1）；或 FSDP + TP 的 2D 并行。' },
        { q: 'ZeRO-3 和 TP 都切参数，本质区别是什么？', a: 'ZeRO-3 切的是**存储**：计算前用 AllGather 把完整参数拼回来，每张卡算的仍是完整的层，本质还是数据并行；通信量与参数量成正比、与 batch 无关，可以预取来隐藏，适合跨机。TP 切的是**计算**：每张卡只算矩阵的一部分，参数从不聚合，每层前向都要对激活做 AllReduce，通信量与 b·s·h 成正比且在关键路径上，所以要放在 NVLink 域内。TP（配合 SP）还能减少单卡激活显存，ZeRO-3 不能。' },
        { q: '1F1B 的 bubble 和 GPipe 一样大，它好在哪？interleaved 的代价是什么？', a: '区别在显存：GPipe 先做完全部 m 个 micro-batch 的前向，要同时保存 m 份激活；1F1B 稳态时一前一后交替，首个 stage 最多保存 p 份激活，与 m 无关，所以可以用更大的 m 压低 bubble。interleaved 1F1B 把每张卡上的层切成 v 段，bubble 降为原来的 1/v，代价是 P2P 通信次数变成 v 倍，并且对 micro-batch 数有整除要求。' },
        { q: 'Megatron SP、Ulysses、Ring Attention 分别解决什么问题？', a: 'Megatron SP 是 TP 的补充：把 TP 没切的 LayerNorm / Dropout 按序列切开以省激活显存，不改变 attention 的计算方式。Ulysses 和 Ring Attention 都是上下文并行，用来处理单卡放不下的长序列：Ulysses 在 attention 前后各做一次 All-to-All，变成每卡负责部分 head 的完整序列，通信量小但并行度不能超过 head 数；Ring Attention 每卡保留自己的 Q 块，KV 块沿环传递并与计算 overlap，不受 head 数限制，但要处理因果 mask 的负载不均。' },
        { q: 'MoE 训练中 All-to-All 占比过高，有哪些优化方向？', a: '① 通信与计算 overlap：dispatch / combine 与专家计算、attention 交叠（如 DualPipe、双 micro-batch 交错）；② 减少跨机流量：限制每个 token 路由到的节点数，机内用 NVLink 转发；③ 专用通信 kernel（如 DeepEP）；④ 负载均衡：aux loss、aux-loss-free 偏置、冗余专家；⑤ 低精度通信：dispatch 时用 FP8 传激活；⑥ 调整 EP 大小与拓扑映射。' },
        { q: 'MFU 只有 30%，你会按什么顺序排查？', a: '先用 profiler 看时间线：① 有没有空闲（数据加载、CPU 开销、同步点、PP bubble）；② 通信是否暴露在关键路径（TP 跨机、FSDP 没预取、梯度同步没 overlap）；③ 计算 kernel 效率（GEMM 形状是否对齐、小算子是否融合、是否用了 FlashAttention 和 torch.compile）；④ 显存压力导致重计算过多或 micro-batch 太小；⑤ 慢节点与网络问题。每改一项都重新测 MFU 并对比时间线。' }
      ],
      bar: '给定模型和集群规模，能给出并行配置，并说清每个维度的显存、通信量和瓶颈。'
    },
    {
      id: 's2', short: '推理框架', title: '推理框架：从单请求到集群', weeks: '第 5–7 周', start: 5, end: 7,
      goal: '能讲清一个请求在 vLLM / SGLang 中的完整路径，以及每个环节的优化点。',
      intro: '从单个请求逐步扩展到整个集群。源码阅读顺序：先读 nano-vllm（约 1200 行 Python，一两天能读完，用来建立全局图），再读 vLLM V1 的 scheduler、KV cache manager、model runner，最后读 SGLang 的 scheduler、radix cache 和 overlap 调度。框架迭代很快，以最新主分支为准。',
      topics: [
        { id: 's2-t1', title: '推理基础', text: 'prefill 是 compute-bound、decode 是 memory-bound；KV cache；指标 TTFT、TPOT（ITL）、吞吐，以及满足 SLO 前提下的 goodput。' },
        { id: 's2-t2', title: 'Attention 与 kernel', text: 'MHA、MQA、GQA、MLA 逐步压缩 KV cache（MLA 靠低秩压缩与权重吸收）；FlashAttention 的核心是 tiling + online softmax，减少的是 HBM 读写而不是 FLOPs；FA2 改进并行划分，FA3 用 warp specialization、TMA 与 FP8；decode 用 Flash-Decoding 沿 KV 长度切分并行；FlashInfer。' },
        { id: 's2-t3', title: 'Batching 与显存管理', text: '从 static batching 到 continuous batching（Orca 的 iteration-level scheduling）；PagedAttention（block table、碎片只出现在最后一块、copy-on-write）；prefix caching（vLLM 块哈希、SGLang RadixAttention）；chunked prefill（Sarathi-Serve）；显存不足时的抢占（重算或换出）。' },
        { id: 's2-t4', title: '降低系统开销', text: 'CUDA Graph（为什么 decode 收益最大、为什么要按 batch 档位 padding）；torch.compile；CPU 调度与 GPU 计算 overlap（SGLang 的 overlap scheduler）。' },
        { id: 's2-t5', title: '投机解码', text: '拒绝采样为什么能严格保持目标分布；接受率与加速比的关系；draft model、Medusa、EAGLE 系列、MTP；为什么大 batch 下收益下降甚至变负。' },
        { id: 's2-t6', title: '分布式推理', text: 'TP 与小消息 AllReduce 优化（custom allreduce kernel）；PP；MoE 的 DP attention + 大规模 EP（DeepEP 的 normal / low-latency 两套 kernel、EPLB 冗余专家）。' },
        { id: 's2-t7', title: 'PD 分离与 KV cache 体系', text: 'DistServe、Splitwise 的动机，Mooncake 以 KV cache 为中心的架构；KV 传输（RDMA、NIXL、Mooncake Transfer Engine）；HBM / DRAM / SSD 多级 KV cache；KV-cache-aware 路由（Dynamo、llm-d、SGLang router）。' }
      ],
      resources: [
        { title: 'nano-vllm', by: 'GitHub', url: 'https://github.com/GeeeekExplorer/nano-vllm', note: '先读它建立全局图' },
        { title: 'vLLM', by: 'GitHub', url: 'https://github.com/vllm-project/vllm' },
        { title: 'SGLang', by: 'GitHub', url: 'https://github.com/sgl-project/sglang' },
        { title: 'FlashInfer', by: 'GitHub', url: 'https://github.com/flashinfer-ai/flashinfer' },
        { title: 'Orca（continuous batching）', by: 'OSDI 2022', url: 'https://www.usenix.org/conference/osdi22/presentation/yu' },
        { title: 'PagedAttention（vLLM）', by: 'arXiv 2309.06180', url: 'https://arxiv.org/abs/2309.06180' },
        { title: 'SGLang（RadixAttention）', by: 'arXiv 2312.07104', url: 'https://arxiv.org/abs/2312.07104' },
        { title: 'Sarathi-Serve（chunked prefill）', by: 'arXiv 2403.02310', url: 'https://arxiv.org/abs/2403.02310' },
        { title: 'DistServe', by: 'arXiv 2401.09670', url: 'https://arxiv.org/abs/2401.09670' },
        { title: 'Splitwise', by: 'arXiv 2311.18677', url: 'https://arxiv.org/abs/2311.18677' },
        { title: 'Mooncake', by: 'arXiv 2407.00079', url: 'https://arxiv.org/abs/2407.00079' },
        { title: 'FlashAttention', by: 'arXiv 2205.14135', url: 'https://arxiv.org/abs/2205.14135' },
        { title: 'FlashAttention-2', by: 'arXiv 2307.08691', url: 'https://arxiv.org/abs/2307.08691' },
        { title: 'FlashAttention-3', by: 'arXiv 2407.08608', url: 'https://arxiv.org/abs/2407.08608' },
        { title: 'Flash-Decoding', by: 'Stanford CRFM', url: 'https://crfm.stanford.edu/2023/10/12/flashdecoding.html' },
        { title: 'Speculative Decoding', by: 'arXiv 2211.17192', url: 'https://arxiv.org/abs/2211.17192' },
        { title: 'Medusa', by: 'arXiv 2401.10774', url: 'https://arxiv.org/abs/2401.10774' },
        { title: 'EAGLE', by: 'arXiv 2401.15077', url: 'https://arxiv.org/abs/2401.15077' },
        { title: 'EAGLE-3', by: 'arXiv 2503.01840', url: 'https://arxiv.org/abs/2503.01840' },
        { title: 'DeepSeek-V2（MLA）', by: 'arXiv 2405.04434', url: 'https://arxiv.org/abs/2405.04434' },
        { title: 'DeepSeek Open Infra Index', by: 'DeepSeek', url: 'https://github.com/deepseek-ai/open-infra-index', note: 'FlashMLA、DeepEP、推理系统概览' },
        { title: 'SGLang 大规模 EP + PD 分离部署 DeepSeek', by: 'LMSYS Blog', url: 'https://lmsys.org/blog/2025-05-05-large-scale-ep/' },
        { title: 'Triton fused attention 教程', by: 'Triton', url: 'https://triton-lang.org/main/getting-started/tutorials/06-fused-attention.html' }
      ],
      projects: [
        { id: 's2-p1', text: '从零写迷你推理引擎：HF 模型 + KV cache 做 greedy decode，再依次加 continuous batching、paged KV cache（block 分配器 + block table）、CUDA Graph，每一步都测吞吐。' },
        { id: 's2-p2', text: '用 vLLM 和 SGLang 部署同一个 8B 模型跑官方 benchmark，调最大并发、每步 token 预算、chunked prefill、prefix caching，画出吞吐-延迟曲线并解释拐点。' },
        { id: 's2-p3', text: '用 Triton 写 FlashAttention 前向，并与 PyTorch SDPA 对比数值和速度。' }
      ],
      quiz: [
        { q: '为什么 decode 是 memory-bound？加大 batch 为什么能提升吞吐，上限在哪？', a: 'decode 每步每个请求只算 1 个 token，却要读完整的权重和自己的 KV cache，线性层算术强度约等于 batch，远低于 GPU 拐点，所以是带宽瓶颈。加大 batch 让一次权重读取服务更多 token，吞吐近似线性上升。上限来自：KV cache 显存决定最大并发；attention 读 KV 的开销不随 batch 摊薄；batch 接近拐点后变成计算瓶颈；以及 TPOT 的 SLO 约束。' },
        { q: 'PagedAttention 解决了什么问题？block size 怎么权衡？', a: '它解决 KV cache 的碎片和预留浪费：传统做法按最大长度给每个请求预留连续显存，内外碎片都很严重。PagedAttention 像操作系统分页一样把 KV 存进固定大小的块，用 block table 把逻辑块映射到物理块，浪费只在最后一块，还能在请求间共享块（并行采样、前缀复用，写时复制）。block 小则浪费少、共享粒度细，但 block table 大、访存不连续、管理开销高；block 大则相反。vLLM 默认 16 个 token。' },
        { q: 'vLLM 的 prefix caching 和 SGLang 的 RadixAttention 有什么区别？', a: '两者都复用相同前缀的 KV cache。vLLM 以块为单位，对“前缀 + 本块 token”做哈希，命中即复用，粒度是整块，配合 LRU 淘汰。RadixAttention 用基数树组织所有缓存的 token 序列，可以在任意 token 位置匹配最长前缀，并配合 cache-aware 调度（优先调度前缀命中多的请求）。面试中讲清“块哈希 vs 前缀树”和“调度是否感知缓存”即可。' },
        { q: 'chunked prefill 和 PD 分离都在缓解 prefill 对 decode 的干扰，什么时候选哪个？', a: 'chunked prefill 把长 prompt 切成固定 token 预算的块，和 decode 混在同一批执行，避免长 prefill 卡住 decode；实现简单、不需要额外实例，但两者仍互相影响，TTFT 会变长。PD 分离把 prefill 和 decode 放到不同实例，各自选并行方式和 batch 策略，彻底消除干扰，适合规模大、SLO 严、输入长的场景；代价是 KV 传输（需要高带宽 RDMA）、部署复杂、两边实例要按负载配比。规模小或输入短时，chunked prefill 往往更划算。' },
        { q: '投机解码在什么情况下会变慢？', a: '① 接受率低（任务分布与 draft 模型差异大、采样温度高）；② 大 batch 时系统已接近 compute-bound，验证多个候选 token 的额外计算不再“免费”；③ draft 本身太慢；④ 实现开销（树状验证、KV 回滚、CUDA Graph 失效）。所以生产系统常按 batch 大小动态开关投机解码或调整候选长度。' },
        { q: '设计题：给定 QPS、平均输入 / 输出长度和 TTFT / TPOT 的 SLO，如何估算卡数？', a: '① 按模型大小和精度确定单实例最少卡数（权重 + KV cache 预算）；② 测出 decode 每步延迟随 batch 的变化，取满足 TPOT 的最大 batch；③ 单实例 decode 吞吐 ≈ batch ÷ TPOT，用 QPS × 平均输出长度 算出 decode 需要的实例数；prefill 侧用 QPS × 平均输入长度 ÷ 单实例 prefill 吞吐，并检查 TTFT；④ 留 30% 左右余量应对峰值；⑤ 再评估 prefix cache 命中率、PD 分离、FP8 量化等优化对结果的影响。' }
      ],
      bar: '能画出 vLLM 或 SGLang 中一个请求从进入到返回的完整路径，并说出每个环节的关键数据结构。'
    },
    {
      id: 's3', short: '量化', title: '量化：从原理到 kernel 与部署', weeks: '第 8 周', start: 8, end: 8,
      goal: '能把一个量化方案从原理、误差来源、kernel 实现讲到端到端收益。',
      intro: '面试官通常从基础一路追问到 kernel 和系统收益。已经熟悉的部分快速过，重点放在“为什么有效”和“什么时候没用”。配套的「量化图解」和「论文库」（130 篇）在下方。',
      topics: [
        { id: 's3-t1', title: '量化基础', text: '对称与非对称；per-tensor / channel / token / group / block 粒度；静态与动态量化；PTQ 与 QAT（STE）；为什么激活比权重难量化（离群通道）。' },
        { id: 's3-t2', title: '数据格式', text: 'FP8 的 E4M3 与 E5M2；INT4 与 FP4（E2M1）；MXFP8 / MXFP4（block 32、E8M0 尺度）与 NVFP4（block 16、E4M3 尺度，外加一级 FP32 张量尺度）。' },
        { id: 's3-t3', title: 'Weight-only 量化', text: 'W4A16 / W8A16：RTN、GPTQ（基于 Hessian 逐列补偿误差）、AWQ（按激活幅度保护显著通道）。它主要在小 batch decode 时加速：4-bit 权重让算术强度变成约 4 倍，H100 上 batch 到七八十就进入 compute-bound，之后反量化开销反而成为负担。' },
        { id: 's3-t4', title: '权重 + 激活量化', text: 'W8A8 / W4A8 / W4A4：LLM.int8()、SmoothQuant（把激活的量化难度迁移到权重）、QuaRot / SpinQuant 等旋转方法、QServe（W4A8KV4）、原生 FP4 硬件上的 W4A4。' },
        { id: 's3-t5', title: 'KV cache 量化', text: 'FP8 KV cache；KIVI 为什么 key 按通道、value 按 token 量化；低比特 KV 对长上下文和 attention kernel 的影响。' },
        { id: 's3-t6', title: '低精度训练', text: 'Transformer Engine 的 FP8 recipe；DeepSeek-V3 的细粒度 FP8 训练（1×128 / 128×128 尺度、提升累加精度）；NVFP4 / MXFP4 预训练（2D block、RHT、随机舍入）。' },
        { id: 's3-t7', title: 'Kernel 与系统落地', text: '把反量化融合进 GEMM 的混合输入 kernel（Marlin、Machete、CUTLASS）；block-scaled GEMM（DeepGEMM）；vLLM / SGLang 如何加载量化 checkpoint、选择 kernel；工具链（llm-compressor、ModelOpt、torchao）；评测不能只看 PPL，推理和长上下文任务往往掉得更多。' }
      ],
      resources: [
        { title: 'MIT 6.5940 EfficientML', by: '课程', url: 'https://efficientml.ai' },
        { title: 'llm-compressor', by: 'vLLM', url: 'https://github.com/vllm-project/llm-compressor' },
        { title: 'TensorRT Model Optimizer', by: 'NVIDIA', url: 'https://github.com/NVIDIA/TensorRT-Model-Optimizer' },
        { title: 'torchao', by: 'PyTorch', url: 'https://github.com/pytorch/ao' },
        { title: 'Transformer Engine', by: 'NVIDIA', url: 'https://github.com/NVIDIA/TransformerEngine' },
        { title: 'DeepGEMM', by: 'DeepSeek', url: 'https://github.com/deepseek-ai/DeepGEMM' },
        { title: '本站论文库', by: '130 篇', url: '#papers', note: '经典基础 20 + 推理侧 92 + 训练侧 18' }
      ],
      projects: [
        { id: 's3-p1', text: '手写 per-channel / per-group 的 INT4 与 FP4（MXFP4、NVFP4）量化和反量化，测某个 Llama 线性层的误差。' },
        { id: 's3-p2', text: '用几十行代码复现 SmoothQuant，对比 naive W8A8 与平滑后的困惑度。' },
        { id: 's3-p3', text: '把一个量化模型接入 vLLM 或 SGLang 跑端到端，对比 BF16、FP8、W4A16、FP4 的精度、吞吐与 TTFT / TPOT。' }
      ],
      quiz: [
        { q: 'GPTQ 和 AWQ 的原理与区别？', a: 'GPTQ 逐层、逐列量化权重，每量化一列就用 Hessian 的逆（H = 2XXᵀ，来自校准激活）把误差补偿到后面尚未量化的列，本质是最小化层输出的重建误差。AWQ 观察到少量与大激活对应的权重通道最重要，通过逐通道放大这些通道（激活侧等价缩小）来降低它们的相对量化误差，缩放因子用网格搜索，只需前向。两者都只需少量校准数据，也都可以与分组量化（如 group size 128）结合；AWQ 不依赖反向传播和重建，对校准集分布更不敏感。' },
        { q: 'SmoothQuant 的缩放公式与 α 的含义？', a: '对每个输入通道 j 取 `s_j = max|X_j|^α / max|W_j|^(1−α)`，把激活除以 s、权重乘以 s：`Y = (X·diag(s)⁻¹)·(diag(s)·W)`，数学上等价。α 控制把多少量化难度从激活迁移到权重：α 越大激活越平滑、权重越难量化，常用 0.5，离群值更严重的模型取更大值。缩放可以融合进前一层的 LayerNorm 或线性层，没有运行时开销。' },
        { q: 'MXFP4 和 NVFP4 的误差特性有什么差别？旋转在块量化下为什么有效，局限在哪？', a: 'MXFP4 每 32 个元素共享一个 E8M0（2 的幂）尺度，尺度只能按 2 倍跳变，块内最大值映射到 FP4 网格时最多浪费接近 1 bit 的范围；NVFP4 每 16 个元素共享一个 E4M3 尺度，再加一级 FP32 张量尺度，尺度更细、块更小，精度通常更好，代价是元数据更多（4.5 bit 对 4.25 bit）。旋转（如 Hadamard）把离群值的能量摊到块内其他元素上，降低块内峰均比；但全局旋转会把离群值扩散到多个块，并与 2 的幂尺度冲突，在小块格式上收益有限甚至有害，所以近期工作多改用与量化块对齐的块旋转（见论文库 B 类与 MR-GPTQ）。' },
        { q: 'FP8 训练中 delayed scaling 有什么问题？DeepSeek-V3 为什么要把部分累加挪到 CUDA core 上做？', a: 'delayed scaling 用前几步的 amax 历史决定当前步的尺度，省掉一次实时规约；但当激活或梯度突然变大（loss spike、离群值出现）时，历史尺度偏小会溢出、偏大则浪费精度，对分布变化快的张量不稳，所以后来更多用 current scaling 或块级细粒度尺度。DeepSeek-V3 发现 H800 上 FP8 GEMM 的 Tensor Core 累加只保留约 14 位精度，K 维很长时误差明显，于是每累加 128 个元素（4 次 WGMMA）就把部分和搬到 CUDA core 上用 FP32 累加，并在这一步乘上细粒度的反量化尺度。' },
        { q: '量化后 GEMM 快了 2 倍，端到端吞吐却只提升 20%，可能的原因有哪些？', a: 'Amdahl 定律：① GEMM 只占端到端时间的一部分，attention（读 KV cache）、norm / 激活 / 采样等小算子、调度和 CPU 开销都没变；② batch 较大时 GEMM 已接近 compute-bound，weight-only 量化只在小 batch 有收益；③ 反量化和激活的动态量化引入额外开销；④ TP 通信时间不变；⑤ KV cache 没量化，长上下文时 attention 占比更高。排查方法：用 profiler 拆分各部分的时间占比。' }
      ],
      bar: '能把一个量化方案从原理、误差来源、kernel 实现讲到端到端收益，并说清它在什么场景下没用。'
    },
    {
      id: 's4', short: '进阶专题', title: '进阶专题：按岗位选一个做深', weeks: '第 9 周', start: 9, end: 9,
      goal: '在目标方向上做出一个能写进简历的小项目。',
      intro: '三个方向任选其一。',
      topics: [
        { id: 's4-t1', title: 'Kernel 方向', text: 'Tensor Core MMA、cp.async；Hopper 的 TMA、wgmma、warp specialization；Blackwell 的 tcgen05 与原生 block-scaled MMA；CUTLASS / CuTe（含 Python 版 CuTe DSL）、TileLang。精读 DeepGEMM 和 FlashAttention-3。' },
        { id: 's4-t2', title: 'MoE 系统', text: 'DeepSeek-V3/R1 推理系统、DeepEP、EPLB，以及 grouped GEMM 与 token dispatch 的 overlap。' },
        { id: 's4-t3', title: 'RL 训练基础设施', text: 'rollout 与训练的共置与分离部署；训练与推理引擎之间的权重同步与 reshard；长尾 rollout 与异步 RL；训推数值不一致（低精度 rollout 时更明显）及 importance sampling 类修正。框架：verl、slime、AReaL、OpenRLHF。' }
      ],
      resources: [
        { title: 'How to Optimize a CUDA Matmul Kernel', by: 'siboehm', url: 'https://siboehm.com/articles/22/CUDA-MMM' },
        { title: 'LeetCUDA', by: 'GitHub', url: 'https://github.com/xlite-dev/LeetCUDA' },
        { title: 'CUTLASS', by: 'NVIDIA', url: 'https://github.com/NVIDIA/cutlass' },
        { title: 'TileLang', by: 'GitHub', url: 'https://github.com/tile-ai/tilelang' },
        { title: 'DeepEP', by: 'DeepSeek', url: 'https://github.com/deepseek-ai/DeepEP' },
        { title: 'EPLB', by: 'DeepSeek', url: 'https://github.com/deepseek-ai/EPLB' },
        { title: 'FlashMLA', by: 'DeepSeek', url: 'https://github.com/deepseek-ai/FlashMLA' },
        { title: 'verl', by: 'GitHub', url: 'https://github.com/volcengine/verl' },
        { title: 'slime', by: 'GitHub', url: 'https://github.com/THUDM/slime' },
        { title: 'AReaL', by: 'GitHub', url: 'https://github.com/inclusionAI/AReaL' },
        { title: 'OpenRLHF', by: 'GitHub', url: 'https://github.com/OpenRLHF/OpenRLHF' },
        { title: 'Awesome-ML-SYS-Tutorial', by: 'GitHub', url: 'https://github.com/zhaochenyang20/Awesome-ML-SYS-Tutorial' }
      ],
      projects: [
        { id: 's4-p1', text: 'Kernel：手写 SGEMM，从 naive 依次做到 shared memory tiling、register tiling、向量化访存、双缓冲，目标达到 cuBLAS 的 80% 以上，记录每一步的性能。' },
        { id: 's4-p2', text: 'MoE：用 DeepEP 或 PyTorch All-to-All 实现一个 EP MoE 层，测 dispatch / combine 的时间占比，并尝试与计算 overlap。' },
        { id: 's4-p3', text: 'RL：用 verl 跑通一个小模型的 GRPO，测 rollout 与训练各占多少时间，分析长尾 rollout 的影响。' }
      ],
      quiz: [
        { q: 'Hopper 上的 warp specialization 是什么？FlashAttention-3 为什么要用它？', a: '把一个 CTA 内的 warpgroup 分成生产者和消费者：生产者用 TMA 异步把数据搬进 shared memory，消费者用 wgmma 做矩阵乘和 softmax，两者通过 barrier 同步形成流水线，让数据搬运、GEMM 与非 GEMM 计算重叠。FA3 还在两个消费者 warpgroup 之间做 ping-pong 调度：一个做 softmax 时另一个做 GEMM，提高 Tensor Core 利用率。' },
        { q: 'DeepEP 的 normal kernel 和 low-latency kernel 有什么区别？', a: 'normal kernel 面向训练和 prefill 的大批量 token，追求吞吐：机内走 NVLink、跨机走 RDMA，并做非对称带宽域之间的转发。low-latency kernel 面向 decode 的小批量，追求延迟：只用 RDMA，并提供基于 hook 的通信计算重叠，不占用 SM。' },
        { q: 'RL 训练中为什么会出现训推不一致？怎么缓解？', a: 'rollout 用推理引擎（vLLM / SGLang），训练用 FSDP / Megatron，两边的 kernel、并行方式和精度（如 FP8 rollout）不同，同一个 token 的 logprob 会有偏差，名义上的 on-policy 实际变成了 off-policy，严重时训练崩溃。缓解：用（截断的）importance sampling 修正；尽量对齐两边的精度与 kernel；MoE 模型可以在训练时复用 rollout 阶段的路由结果。' }
      ],
      bar: '能讲清所选方向的核心技术，并有一个带具体数字的小项目。'
    },
    {
      id: 's5', short: '面试冲刺', title: '面试冲刺：把知识转成表现', weeks: '第 10 周', start: 10, end: 10,
      goal: '手撕、估算、系统设计和项目深挖四类题都能稳定发挥。',
      intro: '本周以练为主，题目清单见页面下方的「面试题库」。',
      topics: [
        { id: 's5-t1', title: '手撕代码', text: '带 KV cache 的 GQA attention、RoPE、RMSNorm、MoE 路由层、top-k / top-p 采样、online softmax、投机解码的接受与拒绝采样、paged KV 的 block 分配器、LRU 与前缀树、per-group 量化与反量化；kernel 题：reduce、softmax、LayerNorm、GEMM（CUDA 或 Triton）。' },
        { id: 's5-t2', title: '估算题', text: '显存、FLOPs、KV cache、通信量、理论延迟，练到不用想就能算出来。' },
        { id: 's5-t3', title: '系统设计', text: '大规模推理服务（容量规划、并行方式、是否 PD 分离、路由与扩缩容）；万卡训练容错（用 Young/Daly 公式由故障间隔推 checkpoint 频率、故障检测与快速恢复）。' },
        { id: 's5-t4', title: '项目复盘', text: '每个项目准备背景、方案、你的贡献、量化结果、踩过的坑、重做会怎么改，并预演连续三层追问。' }
      ],
      resources: [
        { title: 'LeetCUDA', by: 'GitHub', url: 'https://github.com/xlite-dev/LeetCUDA', note: 'kernel 手撕题' },
        { title: 'Awesome-LLM-Inference', by: 'GitHub', url: 'https://github.com/xlite-dev/Awesome-LLM-Inference' }
      ],
      projects: [
        { id: 's5-p1', text: '连续一周每天限时完成 2 道手撕题和 1 道估算题。' },
        { id: 's5-p2', text: '做两次模拟面试：一次偏系统设计，一次偏项目深挖。' }
      ],
      quiz: [
        { q: '万卡训练如何确定 checkpoint 间隔？', a: 'Young/Daly 近似：最优间隔 ≈ √(2 × 保存一次 checkpoint 的耗时 × 平均故障间隔)。例如保存耗时 1 分钟、集群平均 3 小时出一次故障，间隔约 √(2 × 1 × 180) ≈ 19 分钟。异步 checkpoint 能把阻塞训练的保存时间降到很低，从而缩短间隔、减少故障时丢失的进度。' },
        { q: '怎么回答“你的项目最大的难点是什么”？', a: '具体到一个可量化的技术问题（例如某个 kernel 只跑到理论峰值的 40%），说明你如何定位（profiler 数据）、尝试过哪些方案、为什么选最终方案、结果数字是多少，以及仍然存在的局限。避免泛泛地说“工作量大”。' }
      ],
      bar: '每类题都有能拿得出手的标准答案和真实数字。'
    }
  ],

  parallel: [
    { name: 'DDP', shard: [], comm: '梯度 AllReduce', vol: '≈ 2Ψ', scope: '跨机', gain: '实现简单，吞吐近线性扩展', cost: '每卡保存完整模型状态（约 16Ψ 字节）' },
    { name: 'ZeRO-1', shard: ['opt'], comm: '梯度 ReduceScatter + 参数 AllGather', vol: '≈ 2Ψ', scope: '跨机', gain: '优化器状态 ÷ N', cost: '几乎没有额外通信' },
    { name: 'ZeRO-2', shard: ['opt', 'grad'], comm: '同 ZeRO-1', vol: '≈ 2Ψ', scope: '跨机', gain: '再省梯度显存', cost: '梯度要分桶 ReduceScatter' },
    { name: 'ZeRO-3 / FSDP', shard: ['opt', 'grad', 'param'], comm: '前向、反向各 AllGather 参数 + 梯度 ReduceScatter', vol: '≈ 3Ψ', scope: '跨机（可用 HSDP）', gain: '模型状态 ÷ N', cost: '通信量 1.5 倍，依赖预取来隐藏' },
    { name: 'TP', shard: ['param', 'grad', 'opt', 'act~'], comm: '每层前向 2 次、反向 2 次激活 AllReduce', vol: '∝ b·s·h，每层都有', scope: '机内 NVLink', gain: '参数与计算一起切，降低单卡显存与延迟', cost: '通信频繁且在关键路径上' },
    { name: 'SP（Megatron）', shard: ['act'], comm: 'AllReduce 拆成 ReduceScatter + AllGather', vol: '与 TP 相同', scope: '与 TP 同组', gain: 'LayerNorm / Dropout 激活 ÷ t', cost: '几乎没有额外代价' },
    { name: 'PP', shard: ['param', 'grad', 'opt'], comm: '相邻 stage 之间 P2P 发送激活与梯度', vol: '∝ b·s·h，只在 stage 边界', scope: '跨机', gain: '按层切显存，通信量小', cost: 'bubble、调度复杂、要做层间负载均衡' },
    { name: 'CP（Ring）', shard: ['act', 'seq'], comm: 'KV 块沿环 P2P 传递，与计算 overlap', vol: '∝ 序列长度', scope: '机内或跨机', gain: '支持超长序列，不受 head 数限制', cost: '因果 mask 负载不均，需 zigzag 切分' },
    { name: 'CP（Ulysses）', shard: ['act', 'seq'], comm: 'attention 前后各一次 All-to-All', vol: '较小', scope: '机内为主', gain: '通信量小、实现直接', cost: '并行度不能超过 head 数' },
    { name: 'EP', shard: ['expert'], comm: 'dispatch / combine All-to-All', vol: '∝ 路由的 token 数', scope: '机内 + 跨机', gain: '专家参数分散，稀疏计算', cost: '负载不均、All-to-All 开销大' }
  ],
  shardKinds: [
    { id: 'param', name: '参数' }, { id: 'grad', name: '梯度' }, { id: 'opt', name: '优化器状态' },
    { id: 'act', name: '激活' }, { id: 'seq', name: '序列' }, { id: 'expert', name: '专家' }
  ],

  flow: [
    { id: 'api', title: '接入与分词', sub: 'API Server', text: 'OpenAI 兼容接口接收请求，tokenize 后放入等待队列。vLLM V1 把 API server 与 EngineCore 拆成不同进程，用 ZMQ 通信，避免 Python 前端拖慢 GPU 循环。', points: ['请求排队与限流', '多进程前后端分离', '流式返回的连接管理'] },
    { id: 'sched', title: '调度器', sub: 'Scheduler', text: '每一步（iteration）决定哪些请求进入本批：continuous batching 让请求随到随加、做完即走；按 token 预算把 prefill chunk 和 decode 混在一起（chunked prefill）；显存不足时抢占（重算或换出）。SGLang 还会按前缀命中情况调度。', points: ['continuous batching', 'chunked prefill 的 token 预算', '抢占：重算 / 换出', 'cache-aware 调度'] },
    { id: 'kv', title: 'KV Cache 管理', sub: 'Block Manager', text: 'PagedAttention 把 KV 存进固定大小的块，block table 记录逻辑块到物理块的映射；prefix caching 用块哈希（vLLM）或基数树（SGLang）复用相同前缀；引用计数 + LRU 决定淘汰；更大规模时扩展到 DRAM / SSD 多级缓存。', points: ['block table 与空闲块链表', '引用计数与写时复制', '前缀缓存与 LRU 淘汰', 'HBM / DRAM / SSD 分层'] },
    { id: 'run', title: '模型执行', sub: 'Model Runner', text: '把本批 token、位置和 block table 拼成输入张量；prefill 走 FlashAttention 类 kernel，decode 走 paged decode kernel；decode 用 CUDA Graph 消除 kernel launch 开销；TP / EP 的通信在层内完成。', points: ['输入准备与 persistent batch', 'prefill / decode 两类 attention kernel', 'CUDA Graph 按 batch 档位捕获', 'TP AllReduce、EP All-to-All'] },
    { id: 'sample', title: '采样', sub: 'Sampler', text: 'temperature / top-k / top-p / 重复惩罚；结构化输出（语法约束解码）；开启投机解码时，在这里用拒绝采样验证 draft token，接受的前缀直接写入结果。', points: ['logits 处理与采样', '结构化输出', '投机解码验证'] },
    { id: 'out', title: '输出', sub: 'Detokenize & Stream', text: '增量 detokenize 并流式返回；请求结束后释放 KV 块，或保留为前缀缓存供后续请求复用。', points: ['增量 detokenize', '释放或缓存 KV 块', '统计 TTFT / TPOT'] }
  ],

  formats: [
    { name: 'FP32', bits: [1, 8, 23], max: '≈ 3.4e38', use: '主权重、优化器状态、累加' },
    { name: 'BF16', bits: [1, 8, 7], max: '≈ 3.4e38', use: '训练与推理的默认精度' },
    { name: 'FP16', bits: [1, 5, 10], max: '65504', use: '训练时需要 loss scaling' },
    { name: 'FP8 E4M3', bits: [1, 4, 3], max: '448', use: '前向权重与激活' },
    { name: 'FP8 E5M2', bits: [1, 5, 2], max: '57344', use: '梯度（动态范围更大）' },
    { name: 'FP6 E2M3', bits: [1, 2, 3], max: '7.5', use: 'MXFP6 元素' },
    { name: 'FP4 E2M1', bits: [1, 2, 1], max: '6', use: 'MXFP4 / NVFP4 元素' },
    { name: 'E8M0', bits: [0, 8, 0], max: '2^127', use: 'MX 块尺度，只能表示 2 的幂' },
    { name: 'INT8', int: 8, max: '127', use: 'W8A8、INT8 KV cache' },
    { name: 'INT4', int: 4, max: '7', use: 'W4A16 分组量化' }
  ],

  blocks: [
    { name: 'MXFP4', elems: 32, elemBits: 4, scale: 'E8M0（8 bit）', extra: '', eff: '4.25', note: 'OCP 标准；尺度只能是 2 的幂，按 2 倍跳变' },
    { name: 'NVFP4', elems: 16, elemBits: 4, scale: 'E4M3（8 bit）', extra: '另加每张量一个 FP32 尺度', eff: '4.5', note: '块更小、尺度更细；两级尺度防止 E4M3 下溢' },
    { name: 'MXFP8', elems: 32, elemBits: 8, scale: 'E8M0（8 bit）', extra: '', eff: '8.25', note: 'Blackwell 原生支持的 FP8 块格式' },
    { name: 'FP8 1×128', elems: 128, elemBits: 8, scale: 'FP32（32 bit）', extra: '', eff: '8.25', note: 'DeepSeek-V3 的激活量化；权重用 128×128 块' }
  ],

  methodMap: {
    cols: ['激活 16 bit', '激活 8 bit', '激活 4 bit'],
    rows: [
      { label: '权重 8 bit', cells: [['INT8 / FP8 weight-only'], ['SmoothQuant', 'LLM.int8()', 'FP8 E4M3', 'DeepSeek-V3'], []] },
      { label: '权重 4 bit', cells: [['GPTQ', 'AWQ', 'OmniQuant', 'QLoRA', 'Marlin'], ['QServe'], ['QuaRot', 'SpinQuant', 'Atom', 'MR-GPTQ', 'Four Over Six', 'WUSH']] },
      { label: '权重 ≤ 3 bit', cells: [['QuIP#'], ['BitNet b1.58'], []] }
    ],
    kv: ['KIVI', 'KVQuant', 'BitDecoding', 'UltraQuant', 'SageAttention3']
  },

  gemms: [
    { name: '前向 Fprop', expr: 'Y = X · W', infer: true, note: '推理只有这一次；离线处理好的权重可以反复使用' },
    { name: '激活梯度 Dgrad', expr: 'dX = dY · Wᵀ', infer: false, note: '权重以转置形式参与：1D 块转置后划分改变，需要 2D 块保证前后向一致' },
    { name: '权重梯度 Wgrad', expr: 'dW = Xᵀ · dY', infer: false, note: 'dY 重尾、动态范围大；常用随机舍入保证无偏，用随机 Hadamard 压住方差' }
  ],

  compare: [
    ['量化哪些 GEMM', '前向 1 次（另有 KV cache 与 attention）', '前向、激活梯度、权重梯度共 3 次，加上优化器状态与通信'],
    ['优化目标', '这一次的输出误差最小，可以有偏', '梯度无偏、方差可控、误差不跨步累积'],
    ['舍入方式', '确定性就近取偶', '前向就近取偶；梯度用随机舍入或其他无偏估计'],
    ['离群值变换', '针对具体权重和数据学习，再融合进权重', '数据无关的随机 Hadamard，主要作用在 Wgrad'],
    ['尺度', '离线搜索误差最小的尺度；激活可用校准过的静态尺度', '每一步按当前最大值实时计算，不能做昂贵搜索'],
    ['块的形状', '只需一种排布（1D）', '权重要转置复用，常用 2D 块'],
    ['保留高精度的部分', '按测出的敏感度选层', '主权重与少数层固定保留'],
    ['怎么验证', '困惑度、KL、任务精度，分钟到小时级', '必须跑长训练对比 loss 曲线，单步误差说明不了稳定性']
  ],
  compareNotes: [
    '**中间地带：QAT / QAD。** 它们虽然要训练，目标却是推理精度：前向做伪量化、矩阵乘仍是 BF16，反向用直通估计（STE），梯度不量化，所以解决的是推理精度问题，而不是让训练变快。',
    '**低精度 RL 把两边混在一起。** rollout 用量化推理、学习端用高精度训练，会引出采样端与训练端数值不一致，需要专门处理（见论文库训练侧 T3 类）。',
    '**同一手段在两边效果不同。** 块 Hadamard 在推理中对 MXFP4 有时有益、对 NVFP4 可能有害；在训练中它是压住随机舍入方差的标准组件。'
  ],

  coding: [
    { id: 'c1', text: '带 KV cache 的 GQA attention（含因果 mask）' },
    { id: 'c2', text: 'RoPE 与 RMSNorm' },
    { id: 'c3', text: 'MoE 路由层（top-k gating + 负载均衡损失）' },
    { id: 'c4', text: 'temperature / top-k / top-p 采样' },
    { id: 'c5', text: 'online softmax（FlashAttention 的核心递推）' },
    { id: 'c6', text: '投机解码的接受与拒绝采样' },
    { id: 'c7', text: 'paged KV cache 的 block 分配器与 block table' },
    { id: 'c8', text: 'LRU 缓存与前缀树（prefix cache）' },
    { id: 'c9', text: 'per-group 对称 / 非对称量化与反量化' },
    { id: 'c10', text: '用 torch.distributed 模拟 Ring AllReduce' },
    { id: 'c11', text: 'CUDA / Triton：reduce 与 softmax' },
    { id: 'c12', text: 'CUDA / Triton：LayerNorm' },
    { id: 'c13', text: 'CUDA / Triton：分块 GEMM' },
    { id: 'c14', text: 'ColumnParallelLinear / RowParallelLinear' }
  ],
  design: [
    { title: '大规模 LLM 推理服务', text: '容量规划（权重 + KV 预算、单实例最大 batch）、并行方式、是否 PD 分离、prefix cache、路由与扩缩容、多租户与优先级、监控指标（TTFT / TPOT / goodput）。' },
    { title: '万卡训练平台容错', text: '故障类型与频率、checkpoint 间隔（Young/Daly）、异步与分片 checkpoint、故障检测（心跳、NCCL 超时、慢节点）、快速重启与弹性训练。' },
    { title: 'RL 后训练系统', text: 'rollout 与训练的资源配比、共置还是分离、权重同步、长尾请求处理、异步与 off-policy 修正。' },
    { title: '量化模型上线流程', text: '格式与方法选择、校准数据、精度评测集（不只看 PPL）、kernel 支持、灰度与回滚、线上监控。' }
  ],
  deepDive: [
    { title: '为什么这些技巧有效', text: 'RHT 为什么能压住块内离群值；梯度为什么需要随机舍入（无偏）；权重为什么用 2D 块量化（前向用 W、反向用 Wᵀ 时量化结果一致）；两级尺度解决什么问题。' },
    { title: '与并行的交互', text: 'FSDP 下先量化再 AllGather 能省多少通信、尺度怎么一起传；per-tensor 尺度在 TP / FSDP 切分后需要跨 rank 规约 amax，块尺度在块边界与切分边界对齐时可以完全本地计算；EP 下 grouped GEMM 的低精度实现。' },
    { title: '端到端收益', text: 'kernel 加速比、端到端吞吐与 MFU、显存节省、与 BF16 的 loss 差距和下游评测，都要有具体数字。' },
    { title: 'Kernel 细节', text: 'tile 大小怎么选、尺度的内存布局、与厂商库的性能对比、不同硬件平台（CUDA / ROCm）上的差异。' }
  ],
  review: ['背景：要解决什么问题，为什么重要', '方案：考虑过哪些方案，为什么选这个', '你的贡献：哪些是你独立完成的', '量化结果：吞吐、延迟、显存、精度的具体数字', '踩过的坑：最难的一个问题和定位过程', '复盘：如果重做会怎么改'],

  gpus: [
    { id: 'a100', name: 'A100 SXM 80GB', tflops: 312, bw: 2.039, mem: 80 },
    { id: 'h100', name: 'H100 SXM', tflops: 989, bw: 3.35, mem: 80 },
    { id: 'h200', name: 'H200', tflops: 989, bw: 4.8, mem: 141 },
    { id: 'b200', name: 'B200（约）', tflops: 2250, bw: 8.0, mem: 180 },
    { id: 'mi300x', name: 'MI300X', tflops: 1307, bw: 5.3, mem: 192 },
    { id: 'mi355x', name: 'MI355X（约）', tflops: 2500, bw: 8.0, mem: 288 }
  ],
  trainPresets: [
    { name: 'Llama-3-8B', params: 8, layers: 32, hidden: 4096, heads: 32 },
    { name: 'Llama-3-70B', params: 70, layers: 80, hidden: 8192, heads: 64 },
    { name: 'Llama-3.1-405B', params: 405, layers: 126, hidden: 16384, heads: 128 }
  ],
  kvPresets: [
    { name: 'Llama-3-8B', layers: 32, kvHeads: 8, headDim: 128 },
    { name: 'Llama-3-70B', layers: 80, kvHeads: 8, headDim: 128 },
    { name: 'Llama-3.1-405B', layers: 126, kvHeads: 8, headDim: 128 },
    { name: 'Qwen2.5-7B', layers: 28, kvHeads: 4, headDim: 128 },
    { name: 'DeepSeek-V3（MLA）', layers: 61, mla: 576 }
  ]
};
